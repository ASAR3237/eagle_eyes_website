/*
 * Livestream demo mode, loaded only by /livestream-demo/.
 *
 * Plays a recorded M5T thermal clip in the real viewer and feeds the map the same
 * `drone_telemetry` messages the Pilot plugin sends over the data channel, so the
 * drone icon, trail, coordinate strip and battery behave exactly as they do live.
 * It never opens a socket or WebRTC connection, and it changes nothing in
 * client.js or map.js: it drives the existing WebRTCViewer from the outside.
 *
 * Footage: ASAR training flight, Nanoose, 2026-11-12 (Matrice 5T thermal, HQ item 1147).
 */
(function () {
  'use strict';

  const DEMO = {
    videoSrc: '/videos/livestream-demo/m5t-thermal.mp4',
    streamId: 'NANOOSE-M5T',
    pilotName: 'Eagle Eyes M5T',
    // centre of the training flight, from the clip's own GPS
    lat: 49.24729,
    lng: -124.33002,
    groundAslM: 172,      // approx. ground elevation at the cut block
    aglM: 46,             // search height
    driftRadiusM: 18,     // slow orbit while the pilot scans
    orbitSeconds: 140,
    batteryStart: 71,     // %, drains slowly so it looks alive
    telemetryHz: 2,
  };

  const M_PER_DEG_LAT = 111320;
  const mPerDegLng = (lat) => 111320 * Math.cos(lat * Math.PI / 180);

  function waitFor(test, cb, tries = 100) {
    if (test()) return cb();
    if (tries <= 0) return console.warn('[demo] viewer did not initialise');
    setTimeout(() => waitFor(test, cb, tries - 1), 100);
  }

  function startVideo(viewer) {
    const v = viewer.remoteVideo;
    v.srcObject = null;
    v.src = DEMO.videoSrc;
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.autoplay = true;
    const p = v.play();
    if (p && p.catch) {
      // Autoplay blocked (rare when muted): start on the first tap anywhere.
      p.catch(() => document.addEventListener('pointerdown', () => v.play(), { once: true }));
    }
  }

  function enterStreamingView(viewer) {
    // The viewer's 500 ms health check reads WebRTC stats; there is no peer connection
    // in demo mode, so report the recorded video as flowing.
    viewer.checkVideoDataFlow = async function () {
      this.isReceivingData = !this.remoteVideo.paused;
      return this.isReceivingData;
    };
    viewer.currentRoomId = DEMO.streamId;
    viewer.currentPublisherName = DEMO.pilotName;
    viewer.streamReceived = true;
    viewer.isReceivingData = true;
    viewer.wasStreaming = true;
    viewer.isStreamOpen = true;          // getState() -> 'STREAMING'
    if (viewer.roomIdInput) viewer.roomIdInput.value = DEMO.streamId;
    if (viewer.roomIdInputMobile) viewer.roomIdInputMobile.value = DEMO.streamId;
    viewer.updateDroneNameDisplay();
    // Same wording the live page uses once a stream is connected. The page still opens its
    // signalling socket, which reports "Not streaming" because no drone is publishing, so pin
    // the status in demo mode.
    const realUpdateStatus = viewer.updateStatus.bind(viewer);
    const realUpdateConn = viewer.updateConnectionStatus.bind(viewer);
    viewer.updateStatus = () => realUpdateStatus('connected', 'Streaming');
    viewer.updateConnectionStatus = () => realUpdateConn('Streaming');
    viewer.updateStatus();
    viewer.updateConnectionStatus();
    const idEl = document.getElementById('roomIdDisplay');   // not updateRoomId(): that writes ?stream= into the URL
    if (idEl) idEl.textContent = DEMO.streamId;
    viewer.updateUIState();
    if (window.droneMap && window.droneMap.setDisconnected) window.droneMap.setDisconnected(false);
  }

  function startTelemetry(viewer) {
    const t0 = Date.now();
    const tick = () => {
      const s = (Date.now() - t0) / 1000;
      const a = (s / DEMO.orbitSeconds) * 2 * Math.PI;
      const north = DEMO.driftRadiusM * Math.sin(a);
      const east = DEMO.driftRadiusM * Math.cos(a);
      const lat = DEMO.lat + north / M_PER_DEG_LAT;
      const lng = DEMO.lng + east / mPerDegLng(DEMO.lat);
      const yaw = ((a * 180 / Math.PI) + 180) % 360 - 180;   // facing along the orbit
      const battery = Math.max(20, Math.round(DEMO.batteryStart - s / 60));
      viewer.handleLocationData({
        type: 'drone_telemetry',
        livestream_id: DEMO.streamId,
        timestamp_epoch_ms: Date.now(),
        state: {
          drone_gps_location: {
            lat, lng,
            altitude_ahl_m: DEMO.aglM,
            altitude_asl_m: DEMO.groundAslM + DEMO.aglM,
            altitude_ellipsoid_m: DEMO.groundAslM + DEMO.aglM - 17,
          },
          drone_pose: { yaw_deg: yaw, pitch_deg: -45, roll_deg: 0 },
          misc: { battery_percent: battery },
        },
      });
      viewer.updateDroneNameDisplay();
    };
    tick();
    setInterval(tick, 1000 / DEMO.telemetryHz);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // client.js creates window.viewer on DOMContentLoaded; map.js creates window.droneMap.
    waitFor(() => window.viewer && window.viewer.remoteVideo, () => {
      const viewer = window.viewer;
      startVideo(viewer);
      enterStreamingView(viewer);
      waitFor(() => window.droneMap && window.droneMap.map, () => {
        startTelemetry(viewer);
        setTimeout(() => window.droneMap.resize && window.droneMap.resize(), 300);
      });
    });
  });
})();
