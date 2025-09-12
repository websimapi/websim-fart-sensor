import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { WebsimSocket, useQuery } from "@websim/use-query";
const room = new WebsimSocket();
const soundFiles = ["fart1.mp3", "fart2.mp3", "fart3.mp3", "fart4.mp3", "fart5.mp3"];
const audioCache = typeof Audio !== "undefined" ? soundFiles.map((file) => new Audio(file)) : [];
const Leaderboard = () => {
  const { data: scores, loading } = useQuery(room.query(`
        SELECT
          fs.id,
          fs.count,
          u.username
        FROM public.fart_scores fs
        JOIN public.user u ON fs.id = u.id
        ORDER BY fs.count DESC
        LIMIT 10
    `));
  return /* @__PURE__ */ jsxDEV("div", { className: "leaderboard", children: [
    /* @__PURE__ */ jsxDEV("h3", { children: " Top Fart Sensers " }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 24,
      columnNumber: 13
    }),
    loading && /* @__PURE__ */ jsxDEV("p", { className: "leaderboard-loading", children: "Loading leaderboard..." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 25,
      columnNumber: 25
    }),
    !loading && scores && /* @__PURE__ */ jsxDEV("ol", { children: [
      scores.map((score, index) => /* @__PURE__ */ jsxDEV("li", { children: [
        /* @__PURE__ */ jsxDEV("span", { className: "username", title: score.username, children: score.username }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 30,
          columnNumber: 29
        }),
        /* @__PURE__ */ jsxDEV("span", { className: "score", children: score.count.toLocaleString() }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 31,
          columnNumber: 29
        })
      ] }, score.id, true, {
        fileName: "<stdin>",
        lineNumber: 29,
        columnNumber: 25
      })),
      scores.length === 0 && /* @__PURE__ */ jsxDEV("p", { className: "leaderboard-loading", children: "No farts detected yet!" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 34,
        columnNumber: 45
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 27,
      columnNumber: 17
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 23,
    columnNumber: 9
  });
};
function App() {
  const [fartCount, setFartCount] = useState(0);
  const [visualActive, setVisualActive] = useState(false);
  const [displayTriggered, setDisplayTriggered] = useState(false);
  const lastFartTime = useRef(0);
  const minFartInterval = 200;
  const currentUserRef = useRef(null);
  const counterRef = useRef(null);
  useEffect(() => {
    const initUser = async () => {
      const user = await window.websim.getCurrentUser();
      currentUserRef.current = user;
      if (user) {
        const userScore = await room.collection("fart_scores").get(user.id);
        if (userScore) {
          setFartCount(userScore.count);
        } else {
          room.collection("fart_scores").upsert({ id: user.id, count: 0 }).catch(console.error);
        }
      }
    };
    initUser();
  }, []);
  const playFartSound = useCallback(() => {
    if (audioCache.length === 0) return;
    const randomIndex = Math.floor(Math.random() * audioCache.length);
    const sound = audioCache[randomIndex];
    sound.currentTime = 0;
    sound.volume = 0.7;
    sound.play().catch((e) => console.log("Could not play sound:", e.message));
  }, []);
  const showVisualEffect = useCallback(() => {
    setVisualActive(true);
    setDisplayTriggered(true);
    setTimeout(() => setVisualActive(false), 600);
    setTimeout(() => setDisplayTriggered(false), 500);
    if (counterRef.current) {
      counterRef.current.style.animation = "none";
      setTimeout(() => {
        counterRef.current.style.animation = "pulse 0.5s ease-out";
      }, 10);
    }
  }, []);
  const triggerFart = useCallback((reason = "Unknown trigger") => {
    const now = Date.now();
    if (now - lastFartTime.current < minFartInterval) return;
    lastFartTime.current = now;
    setFartCount((prevCount) => {
      const newCount = prevCount + 1;
      if (currentUserRef.current) {
        room.collection("fart_scores").upsert({
          id: currentUserRef.current.id,
          count: newCount
        }).catch(console.error);
      }
      console.log(` FART #${newCount}: ${reason}`);
      return newCount;
    });
    playFartSound();
    showVisualEffect();
  }, [playFartSound, showVisualEffect]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      const keyName = e.key === "AudioVolumeUp" ? "Volume Up" : e.key === "AudioVolumeDown" ? "Volume Down" : e.key === "AudioVolumeMute" ? "Volume Mute" : `Key: ${e.key}`;
      triggerFart(`${keyName} pressed!`);
    };
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => triggerFart("Window resized!"), 300);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) triggerFart("Tab switch detected!");
    };
    const handleBlur = () => triggerFart("Window blur detected!");
    const handleClick = () => triggerFart("Tap detected!");
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    setTimeout(() => triggerFart("Page loaded!"), 1e3);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [triggerFart]);
  return /* @__PURE__ */ jsxDEV("div", { className: "container", children: [
    /* @__PURE__ */ jsxDEV("header", { className: "header", children: [
      /* @__PURE__ */ jsxDEV("h1", { className: "title", children: " FART SENSOR " }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 152,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "subtitle", children: "Detecting device flatulence since 2024" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 153,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 151,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: `sensor-display ${displayTriggered ? "triggered" : ""}`, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "fart-counter", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "counter-label", children: "Your Farts:" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 158,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "counter-value", id: "fartCounter", ref: counterRef, children: fartCount.toLocaleString() }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 159,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 157,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "sensor-status", id: "sensorStatus", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "status-indicator" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 163,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: "Sensor Active" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 164,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 162,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: `fart-visual ${visualActive ? "active" : ""}`, id: "fartVisual" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 167,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 156,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV(Leaderboard, {}, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 170,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "trigger-info", children: [
      /* @__PURE__ */ jsxDEV("h3", { children: "Fart Triggers Active:" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 173,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("ul", { children: [
        /* @__PURE__ */ jsxDEV("li", { children: " Tap anywhere on screen" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 175,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("li", { children: " Switch browser tabs" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 176,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("li", { children: " Press volume keys" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 177,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("li", { children: " Press any key" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 178,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("li", { children: " Resize window" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 179,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 174,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 172,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("footer", { className: "footer", children: /* @__PURE__ */ jsxDEV("p", { children: "Warning: May cause uncontrollable laughter" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 184,
      columnNumber: 17
    }, this) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 183,
      columnNumber: 13
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 150,
    columnNumber: 9
  }, this);
}
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 191,
  columnNumber: 13
}));
