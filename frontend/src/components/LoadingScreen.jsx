import React from "react";

const LoadingScreen = () => {
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#121212",
        color: "#fff",
        textAlign: "center",
        overflow: "hidden",
        padding: "0 1rem",
      }}
    >
      <h1
        style={{
          fontSize: "3.5rem",
          fontWeight: 900, // thicker, bold
          marginBottom: "1rem",
          background: "linear-gradient(90deg, #4fc3f7, #0288d1)", // bluish gradient
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 2px 8px rgba(0,0,0,0.4)", // subtle depth
          animation: "fadeInScale 1.5s ease-in-out forwards",
        }}
      >
        WG-App
      </h1>
      <p
        style={{
          fontSize: "1.5rem",
          fontWeight: 500,
          color: "#4fc3f7",
          opacity: 0,
          animation: "fadeInSlide 2s 1.5s ease-out forwards",
        }}
      >
        Stay Organized! Stay ahead 🚀
      </p>

      <style>
        {`
          @keyframes fadeInScale {
            0% { opacity: 0; transform: scale(0.8) translateY(20px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }

          @keyframes fadeInSlide {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          /* Mobile responsiveness */
          @media (max-width: 480px) {
            h1 {
              font-size: 2.5rem !important;
            }
            p {
              font-size: 1.2rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingScreen;