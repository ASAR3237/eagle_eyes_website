// ============================================================
//  Eagle Eyes — Advanced RPAS Course : quiz bank
// ============================================================
//
//  Quizzes are aligned to the 8 Transport Canada exam sections
//  taught in the "Eagle eyes Advanced course" deck. Every
//  question is grounded in the actual slide content.
//
//  HOW TO ADD / EDIT A QUIZ
//  ------------------------
//  The KEY (e.g. "airlaw") is the quiz's URL tag and QR code:
//      quiz.html?q=airlaw
//
//  Each question object:
//    q           : the question text (string)            [required]
//    options     : array of answer choices (4 is ideal)  [required]
//    answer      : index (0-based) of the correct option [required]
//    explanation : shown after answering (string)        [optional]
//
//  For a True/False question, use options: ["True", "False"].
//  Keep answer indexes correct! (0 = first option, 1 = second, ...)
// ============================================================

const QUIZZES = {

  // ---------------------------------------------------------- SECTION 1
  "airlaw": {
    title: "Section 1: Air Law",
    description: "Airspace classes, CARs Part IX, distances, registration and pilot responsibilities.",
    questions: [
      {
        q: "What is the maximum altitude for standard RPAS operations, and what is it measured against?",
        options: ["500 ft above sea level (ASL)", "400 ft above ground level (AGL)", "400 ft above sea level (ASL)", "122 ft above ground level (AGL)"],
        answer: 1,
        explanation: "Per § 901.25, the limit is 400 ft (about 122 m) AGL, measured from the terrain directly below the drone — not above sea level. Above 400 ft AGL requires an SFOC."
      },
      {
        q: "Which class of airspace begins at 18,000 ft, is IFR-only, and is effectively never available to RPAS?",
        options: ["Class A", "Class B", "Class E", "Class G"],
        answer: 0,
        explanation: "Class A (18,000 ft ASL and up) is IFR only with no RPAS access ever — well above the 400 ft AGL ceiling anyway."
      },
      {
        q: "Under Basic operations, what minimum horizontal distance must you keep from bystanders?",
        options: ["5 m", "100 m", "30 m", "3 m"],
        answer: 2,
        explanation: "Basic requires a minimum 30 m horizontal distance from bystanders. Advanced can fly as close as 5 m with a compliant declared drone."
      },
      {
        q: "Basic ops must stay 3 NM from aerodromes. What is the corresponding distance from a certified heliport?",
        options: ["3 NM (5.6 km)", "5 NM (9.3 km)", "1 NM (1.85 km)", "0.5 NM (0.93 km)"],
        answer: 2,
        explanation: "Stay 3 NM from aerodromes but 1 NM (1.85 km) from certified heliports; both apply unless authorized."
      },
      {
        q: "An Advanced pilot wants to operate in controlled airspace (Class C, D, E or F). What is required before flying?",
        options: ["Nothing extra — the Advanced certificate alone authorizes it", "Authorization from NAV CANADA (e.g. via NAV Drone)", "A Special Flight Operations Certificate (SFOC) from Transport Canada", "Only a phone call to the nearest police detachment"],
        answer: 1,
        explanation: "Advanced holders may fly controlled airspace only with NAV CANADA RPAS authorization, requested per operation. It is not automatic with the certificate."
      },
      {
        q: "Which CARs Part IX section establishes the prohibition on Basic operations in built-up areas?",
        options: ["§ 901.14", "§ 901.25", "§ 901.19", "§ 901.27"],
        answer: 2,
        explanation: "§ 901.19 prohibits Basic operations in built-up areas. The classification is geographic — it applies whether or not people are present."
      },
      {
        q: "At what weight must a drone be registered with Transport Canada?",
        options: ["Above 250 g", "Above 1 kg", "Above 25 kg", "Above 150 kg"],
        answer: 0,
        explanation: "All drones above 250 g must be registered via the Drone Management Portal, and the registration number must be displayed visibly on the drone."
      },
      {
        q: "How long is an RPAS pilot certificate valid before recency must be re-established?",
        options: ["12 months", "60 months", "36 months", "24 months"],
        answer: 3,
        explanation: "Certificates are valid 24 months. Maintain recency with a flight review, retaking the exam, or an approved recency course — or you cannot fly legally."
      }
    ]
  },

  // ---------------------------------------------------------- SECTION 2
  "systems": {
    title: "Section 2: Airframes & Systems",
    description: "Drone components, flight controllers, batteries, propulsion and fail-safes.",
    questions: [
      {
        q: "What is the minimum number of satellites a GNSS receiver needs to obtain a 3D position fix?",
        options: ["3 satellites", "4 satellites", "6 satellites", "8 satellites"],
        answer: 1,
        explanation: "A minimum of 4 satellites is required for a 3D position fix; more satellites improve accuracy."
      },
      {
        q: "For a typical LiPo cell, what are the nominal, fully-charged, and storage voltages?",
        options: ["3.0V nominal, 3.7V full, 3.3V storage", "3.7V nominal, 4.2V full, 3.8V storage", "4.2V nominal, 4.7V full, 4.0V storage", "3.3V nominal, 4.0V full, 3.6V storage"],
        answer: 1,
        explanation: "LiPo cells are 3.7V nominal, 4.2V fully charged, and should be stored at about 3.8V per cell."
      },
      {
        q: "On a multi-rotor, what is the function of an ESC (Electronic Speed Controller)?",
        options: ["It distributes regulated power to all avionics components", "It steps battery voltage down to 5V for the receiver", "There is one per motor, converting DC to AC to control brushless motor RPM", "It processes IMU and GPS data to stabilize the aircraft"],
        answer: 2,
        explanation: "Each brushless motor has its own ESC, which converts DC to AC and precisely controls motor RPM on command from the flight controller."
      },
      {
        q: "If GPS signal is lost in flight, what flight mode does the drone typically revert to, and what is the consequence?",
        options: ["GPS/Position mode — it continues to hover and hold position", "ATTI/Attitude mode — it self-levels but drifts with the wind", "Manual/Acro mode — no stabilization, pilot has full control", "RTH mode — it automatically lands at the takeoff point"],
        answer: 1,
        explanation: "Without GPS the drone reverts to ATTI mode, which self-levels when sticks are centered but drifts with the wind, so the pilot must manually hold position."
      },
      {
        q: "On a multi-rotor, why are propellers installed as CW and CCW pairs?",
        options: ["To increase total thrust beyond a single rotation direction", "Because opposing rotation cancels yaw torque", "To allow flight in ATTI mode without GPS", "To reduce the load on the power distribution board"],
        answer: 1,
        explanation: "Clockwise and counter-clockwise prop pairs have opposing rotation that cancels yaw torque. The correct prop must go on the correct motor."
      },
      {
        q: "What is a likely early sign that a servo is beginning to fail?",
        options: ["Faster, smoother response than normal", "Increased flight time and efficiency", "Sticky or jerky movement, skipping positions, or buzzing", "Improved camera stabilization"],
        answer: 2,
        explanation: "Servo failure shows up as sticky/jerky movement, skipped positions, buzzing or overheating — a failing servo should be replaced immediately."
      },
      {
        q: "Who is responsible for ensuring the RPAS is airworthy before every flight?",
        options: ["The pilot-in-command (PIC)", "The drone manufacturer", "The visual observer", "Transport Canada"],
        answer: 0,
        explanation: "The PIC is responsible for ensuring the drone is airworthy, including completing the pre-flight inspection and maintaining the maintenance log."
      }
    ]
  },

  // ---------------------------------------------------------- SECTION 3
  "humanfactors": {
    title: "Section 3: Human Factors",
    description: "Decision-making, IMSAFE, situational awareness, fatigue and crew resource management.",
    questions: [
      {
        q: "In the IMSAFE checklist, what does the letter 'A' stand for?",
        options: ["Awareness", "Attitude", "Alcohol", "Altitude"],
        answer: 2,
        explanation: "In IMSAFE, 'A' is Alcohol — have you consumed alcohol in the last 8–12 hours before flying?"
      },
      {
        q: "What are the six steps of the DECIDE model, in order?",
        options: ["Detect, Estimate, Choose, Identify, Do, Evaluate", "Define, Examine, Calculate, Implement, Decide, Execute", "Detect, Evaluate, Confirm, Implement, Decide, Estimate", "Determine, Estimate, Choose, Inspect, Do, Evaluate"],
        answer: 0,
        explanation: "DECIDE = Detect, Estimate, Choose, Identify, Do, Evaluate — a systematic approach to aeronautical decision-making."
      },
      {
        q: "Which of the following is one of the five hazardous attitudes a pilot should avoid?",
        options: ["Curiosity", "Invulnerability", "Optimism", "Patience"],
        answer: 1,
        explanation: "Invulnerability ('it won't happen to me') is one of the five hazardous attitudes, along with anti-authority, impulsivity, macho, and resignation."
      },
      {
        q: "Situational awareness has three levels. What are they, in order?",
        options: ["Observation, Analysis, Reaction", "Detection, Estimation, Execution", "Perception, Comprehension, Projection", "Awareness, Judgment, Decision"],
        answer: 2,
        explanation: "The three levels of SA are Perception (what is happening now), Comprehension (what it means), and Projection (what will happen next)."
      },
      {
        q: "What is 'empty-field myopia'?",
        options: ["The eyes focus close (around 2 m) when looking at a featureless sky, missing distant aircraft", "A permanent loss of peripheral vision caused by fatigue", "An inability to judge a drone's distance in bright sunlight", "The tendency to stare at the drone instead of scanning"],
        answer: 0,
        explanation: "In a featureless sky the eyes default to focusing close (about 2 m), so distant aircraft can be missed. Deliberately refocus on a distant object while scanning."
      },
      {
        q: "Which statement about fatigue in RPAS operations is correct?",
        options: ["Acute stress always impairs performance more than chronic stress", "Fatigue only affects pilots of manned aircraft", "Fatigue is cumulative, building over days without adequate rest", "Mental fatigue has no effect on reaction time"],
        answer: 2,
        explanation: "Fatigue is cumulative — it builds over days without adequate rest and causes slower reactions, poor judgment, and reduced awareness."
      },
      {
        q: "In Crew Resource Management (CRM), what does a 'speak-up culture' mean?",
        options: ["Only the pilot-in-command may raise concerns", "Anyone on the crew can call out a safety concern", "Crew must use loud verbal signals over radio", "The payload operator leads all briefings"],
        answer: 1,
        explanation: "A speak-up culture means anyone on the crew can raise a safety concern — though the PIC retains final authority."
      }
    ]
  },

  // ---------------------------------------------------------- SECTION 4
  "weather": {
    title: "Section 4: Meteorology",
    description: "Weather systems, clouds, density altitude, and decoding METARs and TAFs.",
    questions: [
      {
        q: "What is the standard atmospheric pressure and temperature at sea level?",
        options: ["29.92 inHg and 15°C", "1013.25 inHg and 20°C", "30.00 inHg and 0°C", "28.92 hPa and 15°C"],
        answer: 0,
        explanation: "Standard sea-level pressure is 29.92 inHg (1013.25 hPa) and standard temperature is 15°C."
      },
      {
        q: "In a Canadian METAR, the wind group 27015G25KT means the wind is:",
        options: ["From 250° at 27 knots gusting 15", "Toward 270° at 15 km/h", "From 270° at 15 knots gusting to 25 knots", "Variable at 270° averaging 25 knots"],
        answer: 2,
        explanation: "First 3 digits are direction in degrees (270°), next digits are speed in knots (15), and G marks gusts (to 25 knots)."
      },
      {
        q: "In a METAR cloud group, what does BKN080 indicate?",
        options: ["Broken layer (5–7 oktas) at 8,000 ft AGL", "Broken layer at 80,000 ft AGL", "Blowing snow at 800 ft", "Broken layer (3–4 oktas) at 800 ft AGL"],
        answer: 0,
        explanation: "BKN = broken (5–7 oktas); cloud heights are in hundreds of feet AGL, so 080 = 8,000 ft."
      },
      {
        q: "Using the temperature–dewpoint spread, how is approximate cloud-base height estimated?",
        options: ["Spread × 1,000 ft", "Spread × 400 ft", "Temperature × 400 ft", "Spread ÷ 2 in thousands of ft"],
        answer: 1,
        explanation: "Spread (temperature minus dewpoint) × 400 gives the approximate cloud-base height in feet. A spread of 0 means fog or cloud."
      },
      {
        q: "Which set of conditions increases density altitude and worsens RPAS performance?",
        options: ["Cold, low elevation, high pressure", "Hot, high elevation, and humid", "Cold, dry, high pressure", "Cool, humid, low elevation"],
        answer: 1,
        explanation: "Higher temperature, humidity and elevation, plus lower pressure, all raise density altitude. Hot, high and humid is the worst case — less lift per RPM."
      },
      {
        q: "Which cloud type develops vertically through all levels and must never be flown near?",
        options: ["Cirrus (Ci)", "Stratus (St)", "Cumulonimbus (Cb)", "Altocumulus (Ac)"],
        answer: 2,
        explanation: "Cumulonimbus (Cb) brings thunderstorms, turbulence, icing, wind shear and lightning — never fly near it."
      },
      {
        q: "In a TAF, which change indicator denotes temporary fluctuations during the forecast period?",
        options: ["FM", "TEMPO", "BECMG", "PROB30"],
        answer: 1,
        explanation: "TEMPO = temporary fluctuations. FM is a permanent change at a stated time, BECMG is a gradual change, and PROB30/40 is a probability."
      },
      {
        q: "An upper-wind forecast reads 2735. What does it mean?",
        options: ["270° at 35 knots", "27° at 35 knots", "2,700 ft at 35°C", "Light and variable"],
        answer: 0,
        explanation: "Upper winds give direction in tens of degrees true then speed in knots: 2735 = 270° at 35 knots. (9900 = light and variable.)"
      }
    ]
  },

  // ---------------------------------------------------------- SECTION 5
  "navigation": {
    title: "Section 5: Navigation",
    description: "Charts, magnetic variation, coordinates, distance and bearing.",
    questions: [
      {
        q: "What is magnetic variation (declination)?",
        options: ["The angular difference between true north and magnetic north", "The difference between your heading and your track", "The error caused by metal objects near the compass", "The angle between magnetic north and grid north"],
        answer: 0,
        explanation: "Magnetic variation (declination) is the angular difference between true north (geographic pole) and magnetic north (where the compass points)."
      },
      {
        q: "Using 'East is Least, West is Best', how do you convert a true heading to magnetic when variation is westerly?",
        options: ["Subtract the variation from the true heading", "Add the variation to the true heading", "Ignore variation; true and magnetic are equal", "Double the variation and subtract it"],
        answer: 1,
        explanation: "Magnetic = True + West variation. 'West is Best' means add westerly variation when going from true to magnetic."
      },
      {
        q: "On a VFR chart, how many nautical miles does 1 degree of latitude equal?",
        options: ["30 NM", "45 NM", "60 NM", "100 NM"],
        answer: 2,
        explanation: "One degree of latitude = 60 NM, because 1 minute of latitude = 1 nautical mile."
      },
      {
        q: "What is the scale of a VFR Navigation Chart (VNC)?",
        options: ["1:250,000", "1:500,000", "1:1,000,000", "1:50,000"],
        answer: 1,
        explanation: "The VNC scale is 1:500,000 (1 cm = 5 km) — the primary chart for cross-country VFR route planning."
      },
      {
        q: "When measuring distance on a chart, which scale should you use and why?",
        options: ["The longitude scale, because it is printed along the top", "The latitude scale, because 1 minute of latitude equals 1 nautical mile", "Either scale, because they are identical everywhere", "The longitude scale, because it stays constant toward the poles"],
        answer: 1,
        explanation: "Use the latitude scale on the side: 1 minute of latitude = 1 NM. Longitude is not used because it shrinks toward the poles."
      },
      {
        q: "How often is the Canada Flight Supplement (CFS) updated?",
        options: ["Every 28 days", "Every 56 days", "Every 90 days", "Once per year"],
        answer: 1,
        explanation: "The CFS is updated every 56 days on the AIRAC cycle, with detailed aerodrome data, frequencies and airspace info."
      },
      {
        q: "Which coordinate format is most commonly used on aviation charts?",
        options: ["Decimal degrees (e.g., 49.2772, -123.1203)", "UTM eastings and northings", "Degrees, minutes, seconds (e.g., N 49° 16' 38\")", "Military grid reference system"],
        answer: 2,
        explanation: "Aviation charts most commonly use degrees-minutes-seconds (DMS), while GPS devices typically display decimal degrees."
      }
    ]
  },

  // ---------------------------------------------------------- SECTION 6
  "flightops": {
    title: "Section 6: Flight Operations",
    description: "Pre-flight planning, site surveys, risk assessment and emergency procedures.",
    questions: [
      {
        q: "What is the universal priority in ANY RPAS emergency?",
        options: ["Recover the aircraft to avoid replacement costs", "Keep people safe — equipment is replaceable, people are not", "Preserve the flight logs for the investigation", "Maintain the planned flight path"],
        answer: 1,
        explanation: "Priority #1 in any emergency is keeping people safe. Equipment is replaceable; people are not."
      },
      {
        q: "When you encounter a manned aircraft, what is the immediate correct action?",
        options: ["Climb above the aircraft to stay clear of its path", "Hold position and hover until it passes", "Descend immediately, move away from its path, and land if it is in your area", "Switch to RTH and let the drone return home"],
        answer: 2,
        explanation: "Manned aircraft always have right of way: descend immediately, move away, and land if it is in your area. Never climb toward it."
      },
      {
        q: "In a flyaway, what is the FIRST immediate action listed in the course?",
        options: ["Chase the drone on foot to recover it", "Try to regain control by toggling flight modes", "Immediately call the manufacturer", "Power off your controller to force a fail-safe"],
        answer: 1,
        explanation: "The immediate-actions order is: (1) try to regain control by toggling modes, then track its position, alert people in its path, and contact ATC if in controlled airspace. Do NOT chase the drone."
      },
      {
        q: "What does the '30% Rule' for battery management state?",
        options: ["Reduce flight time by 30% in cold weather", "Always plan to land with at least 30% battery remaining", "Replace any battery that has lost 30% of capacity", "Keep 30% of your batteries as warm spares"],
        answer: 1,
        explanation: "The 30% Rule: always plan to land with at least 30% battery remaining as a safety margin."
      },
      {
        q: "How much capacity can LiPo batteries lose in cold weather?",
        options: ["5–10%", "10–15%", "20–40%", "50–60%"],
        answer: 2,
        explanation: "Cold temperatures drop LiPo capacity by 20–40%. Pre-warm batteries and expect shorter flight times in winter."
      },
      {
        q: "Within what timeframe should a near-miss with a manned aircraft be filed with Transport Canada?",
        options: ["Within 24 hours", "Within 72 hours", "Within 7 days", "Within 30 days"],
        answer: 0,
        explanation: "Report any near-miss to Transport Canada and file within 24 hours, documenting time, location and altitude."
      },
      {
        q: "What anti-collision lighting is required for night operations?",
        options: ["Steady white lights visible for 1 statute mile", "Flashing/strobe lights visible for 3 statute miles from all directions", "Red and green navigation lights visible for 5 nautical miles", "Any LED lights visible to the pilot only"],
        answer: 1,
        explanation: "Night ops require anti-collision lights that flash/strobe, are visible for 3 statute miles, and are visible from all directions."
      },
      {
        q: "Which of the following is a mandatory incident-reporting situation to Transport Canada?",
        options: ["Any flight conducted in Class G airspace", "A drone flyaway or loss of the aircraft", "Landing with less than 30% battery", "Flying within 30 minutes of sunset"],
        answer: 1,
        explanation: "A flyaway or loss of the aircraft is mandatory to report, along with injury, property damage, a near-miss, or an airspace incursion."
      }
    ]
  },

  // ---------------------------------------------------------- SECTION 7
  "theoryofflight": {
    title: "Section 7: Theory of Flight",
    description: "The four forces, drag, load factor, centre of gravity and stability.",
    questions: [
      {
        q: "In level, unaccelerated flight, what is the relationship between the four forces?",
        options: ["Lift is greater than weight, and thrust is greater than drag", "Lift equals weight, and thrust equals drag", "Weight equals drag, and lift equals thrust", "Thrust is greater than drag, and lift equals weight"],
        answer: 1,
        explanation: "In level, unaccelerated flight Lift = Weight and Thrust = Drag — all forces are balanced."
      },
      {
        q: "How does a multi-rotor drone move forward (pitch)?",
        options: ["The front motors speed up while the rear motors slow down", "All motors speed up equally to push the drone ahead", "The front motors slow and the rear motors speed up, tilting the drone forward", "The propellers change blade pitch to angle airflow backward"],
        answer: 2,
        explanation: "Slowing the front motors and speeding the rear motors tilts the drone forward, creating horizontal thrust; more tilt = faster forward speed."
      },
      {
        q: "Which statement correctly describes parasite drag?",
        options: ["It is a byproduct of generating lift and is greatest during hover", "It is caused by the drone's body moving through air and increases with the square of airspeed", "It is caused by propeller tip vortices and decreases with airspeed", "It is minimized at cruise speed and unaffected by airspeed"],
        answer: 1,
        explanation: "Parasite drag comes from the body pushing through the air (form drag + skin friction) and increases with the square of airspeed."
      },
      {
        q: "What is the approximate load factor in a steep 60-degree banked turn?",
        options: ["1.0G", "1.2G", "2.0G", "3.0G"],
        answer: 2,
        explanation: "A 60° banked turn is about 2.0G — double the 1.0G of level flight — because extra lift is needed to hold altitude while banked."
      },
      {
        q: "What happens if a multi-rotor's centre of gravity is too far back (aft)?",
        options: ["It tends to pitch nose-down and loses efficiency", "It tends to pitch nose-up and has unstable, harder-to-control flight", "It becomes perfectly stable and uses less battery", "The flight controller shuts the motors down to protect the airframe"],
        answer: 1,
        explanation: "A too-far-aft CG makes the drone tend to pitch nose-up, producing unstable flight that is harder to control."
      },
      {
        q: "Which combination of conditions produces the WORST drone performance?",
        options: ["Cold, low-altitude, dry air", "Hot, high-altitude, humid air", "Cool, high-altitude, dry air", "Hot, low-altitude, dry air"],
        answer: 1,
        explanation: "Hot, high and humid all reduce air density, giving less lift per RPM — the worst-case combination."
      },
      {
        q: "Which is an advantage of a fixed-wing drone over a multi-rotor?",
        options: ["It can hover precisely in one spot", "It offers vertical takeoff and landing (VTOL)", "It has longer flight times and covers a larger area per flight", "It is less sensitive to wind during flight"],
        answer: 2,
        explanation: "Fixed-wing drones cannot hover but give longer endurance and larger coverage per flight — ideal for mapping and long-range survey."
      }
    ]
  },

  // ---------------------------------------------------------- SECTION 8
  "radio": {
    title: "Section 8: Radiotelephony",
    description: "Radio certificate, phraseology, frequencies and emergency calls.",
    questions: [
      {
        q: "Which government body issues the Restricted Operator Certificate – Aeronautical (ROC-A)?",
        options: ["Transport Canada", "NAV CANADA", "Innovation, Science & Economic Development Canada (ISED)", "Royal Canadian Mounted Police"],
        answer: 2,
        explanation: "The ROC-A is issued by Innovation, Science & Economic Development Canada (ISED) — not Transport Canada — and is needed to transmit on aeronautical frequencies."
      },
      {
        q: "On the radio, what does the term 'WILCO' mean?",
        options: ["I have received your message", "Will comply with your instruction", "Wait, I will call you", "Repeat your last transmission"],
        answer: 1,
        explanation: "WILCO = 'will comply.' (ROGER = message received; STAND BY = wait; SAY AGAIN = repeat.)"
      },
      {
        q: "Which emergency call is used for a life-threatening (distress) situation?",
        options: ["PAN PAN, repeated three times", "SECURITE, repeated three times", "MAYDAY, repeated three times", "SQUAWK 7600"],
        answer: 2,
        explanation: "MAYDAY (×3) signals life-threatening distress; PAN PAN (×3) signals an urgent but not immediately life-threatening situation."
      },
      {
        q: "What is 126.7 MHz designated for?",
        options: ["Universal emergency/distress frequency", "Mandatory Frequency (MF) for uncontrolled aerodromes / RPAS blind broadcasts", "Tower frequency at controlled airports", "Ground control at large airports"],
        answer: 1,
        explanation: "126.7 MHz is a Mandatory Frequency (MF) for broadcasting intentions. 121.5 is the emergency frequency; 123.2 is the CTAF."
      },
      {
        q: "In controlled airspace, what transponder code should you squawk for a two-way radio communication failure?",
        options: ["7700", "7600", "7500", "1200"],
        answer: 1,
        explanation: "A two-way radio failure = squawk 7600, follow published procedures, land as soon as safely possible, and contact ATC by phone."
      },
      {
        q: "What is a 'blind broadcast' in the RPAS radio-call procedures?",
        options: ["A one-way informational call where no response is expected", "A mandatory read-back of ATC instructions", "An encrypted transmission to crew members only", "A request for ATIS information"],
        answer: 0,
        explanation: "A blind broadcast is one-way and informational — no response expected — used at uncontrolled aerodromes to alert other pilots to your presence."
      }
    ]
  },

};

if (typeof module !== "undefined") { module.exports = QUIZZES; }
