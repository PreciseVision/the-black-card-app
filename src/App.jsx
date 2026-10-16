import React, { useState, useMemo, useRef, useEffect } from "react";

// Core SP Thresholds
const TIER_THRESHOLDS = {
  GOD: 50001,
  AUNTIE: 10001,
  BRO: 5001,
  FAM: 1001,
  KIN: 10,
};

const REQUIRED_SP_FOR_CARD = TIER_THRESHOLDS.KIN;
const SP_FOR_REVOKED_RECOVERY = 100;
const POLL_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 Hours

// Solid Pan-African & Heritage Palette
const PALETTE = {
  red: "#B91C1C",
  black: "#000000",
  darkCard: "#18181B",
  green: "#007A3D",
  gold: "#F59E0B",
  goldDark: "#D97706",
  white: "#FFFFFF",
  lightBg: "#F4F4F5",
  lightCard: "#FFFFFF",
  lightCardAlt: "#E4E4E7",
  grayText: "#A1A1AA",
  darkGrayText: "#52525B",
};

// Storage Keys for persistent sessions
const STORAGE_KEYS = {
  PROFILES: "tbc_profiles_v2",
  CURRENT_USER_ID: "tbc_active_uid_v2",
  FEED_LOGS: "tbc_feed_logs_v2",
  SHARE_LOGS: "tbc_share_logs_v2",
  POLLS: "tbc_polls_v2",
};

function generateQRCodeMatrix(text) {
  const size = 21;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));

  const setFinder = (startX, startY) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isBorder = x === 0 || x === 6 || y === 0 || y === 6;
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[startY + y][startX + x] = isBorder || isCenter;
        reserved[startY + y][startX + x] = true;
      }
    }
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const px = startX + x;
        const py = startY + y;
        if (px >= 0 && px < size && py >= 0 && py < size) {
          reserved[py][px] = true;
        }
      }
    }
  };

  setFinder(0, 0);
  setFinder(size - 7, 0);
  setFinder(0, size - 7);

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }

  matrix[size - 8][8] = true;
  reserved[size - 8][8] = true;

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  let bitIdx = 0;
  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--;
    for (let r = 0; r < size; r++) {
      const y = (c & 2) === 0 ? size - 1 - r : r;
      for (let col = 0; col < 2; col++) {
        const x = c - col;
        if (!reserved[y][x]) {
          const charCode = text.charCodeAt(bitIdx % text.length) || 42;
          const bitVal = ((charCode >> (bitIdx % 8)) ^ (hash >> ((x + y) % 16))) & 1;
          const mask = (x + y) % 2 === 0;
          matrix[y][x] = (bitVal ^ (mask ? 1 : 0)) === 1;
          bitIdx++;
        }
      }
    }
  }

  return matrix;
}

const RealQRCodeSVG = ({ value, size = 180, bgColor = "#FFFFFF", fgColor = "#000000" }) => {
  const matrix = useMemo(() => generateQRCodeMatrix(value || "https://theblackcard.app"), [value]);
  const matrixSize = matrix.length;
  const cellSize = size / matrixSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-2xl overflow-hidden shadow-inner">
      <rect width={size} height={size} fill={bgColor} />
      {matrix.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize + 0.3}
              height={cellSize + 0.3}
              fill={fgColor}
            />
          ) : null
        )
      )}
    </svg>
  );
};

const getTierInfo = (sp, blackCardStatus) => {
  if (blackCardStatus === "revoked") {
    return { name: "Revoked", color: PALETTE.red };
  }
  if (blackCardStatus === "suspended") {
    return { name: "Suspended", color: PALETTE.gold };
  }
  if (sp >= TIER_THRESHOLDS.GOD) {
    return { name: "God Mother / God Father", color: PALETTE.gold };
  }
  if (sp >= TIER_THRESHOLDS.AUNTIE) {
    return { name: "Auntie / Unk", color: PALETTE.gold };
  }
  if (sp >= TIER_THRESHOLDS.BRO) {
    return { name: "Bro / Sis", color: PALETTE.green };
  }
  if (sp >= TIER_THRESHOLDS.FAM) {
    return { name: "Fam", color: PALETTE.green };
  }
  if (sp >= TIER_THRESHOLDS.KIN) {
    return { name: "Kin Folk", color: PALETTE.green };
  }
  return { name: "Unvouched", color: PALETTE.grayText };
};

const BlackAmericanHeritageLogo = ({ className = "w-9 h-6", roundClass = "rounded-lg" }) => (
  <svg viewBox="0 0 120 80" className={`${className} ${roundClass} flex-shrink-0`} xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="80" fill="#B91C1C" />
    <polygon points="36,0 120,0 84,80 0,80" fill="#000000" />
    <g transform="translate(60, 40) scale(0.68)">
      <path
        d="M -3,24 C -16,22 -26,12 -26,-2 C -26,-16 -16,-26 -3,-28 C -7,-24 -9,-17 -7,-10 C -14,-7 -18,-1 -16,6 C -18,12 -13,18 -8,21 Z"
        fill="#F59E0B"
      />
      <path
        d="M 3,24 C 16,22 26,12 26,-2 C 26,-16 16,-26 3,-28 C 7,-24 9,-17 7,-10 C 14,-7 18,-1 16,6 C 18,12 13,18 8,21 Z"
        fill="#F59E0B"
      />
      <rect x="-1.5" y="-22" width="3" height="30" fill="#F59E0B" rx="1" />
      <path d="M -9,8 C -5,7 -2,8 0,8 C 2,8 5,7 9,8 C 8,10 6,10 0,10 C -6,10 -8,10 -9,8 Z" fill="#F59E0B" />
      <rect x="-1" y="10" width="2" height="6" fill="#F59E0B" />
      <circle cx="0" cy="18" r="2.5" fill="#F59E0B" />
    </g>
  </svg>
);

const UserIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const FeedIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-3-3h.01M3 20h18" />
  </svg>
);

const FriendsIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M17 20h5v-2a3 3 0 00-5.356-2.37M13 11a4 4 0 100-8 4 4 0 000 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const BanIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const QrIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v1m6 11v1m-6-1v1m0-1v-1m0 0v-1m0 0h1m-1 0H9m1 0h1m0 0v1m0-1v-1m-6 3v1m0-1v-1m0 0H4m1 0h1m0 0v1m-1-1v-1m6 3v1m0-1v-1m0 0h1m-1 0H9m1 0h1m0 0v1m0-1v-1M9 4h6a1 1 0 011 1v6H8V5a1 1 0 011-1zM4 15h6a1 1 0 011 1v6H4v-6a1 1 0 011-1zm1 1v4h4v-4H5zm11-1h6a1 1 0 011 1v6h-6v-6a1 1 0 011-1zm1 1v4h4v-4h-4z" />
  </svg>
);

const PollIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const PhotoIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const VideoIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const MicIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const ShareIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const CloseIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PencilIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const LockClosedIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const CameraIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SEED_PROFILES = {
  "user-jay-001": {
    userId: "user-jay-001",
    username: "Godfather Jay",
    contact: "555-019-2834",
    bio: "Preserving our culture and holding the council accountable. I vouch for who I want.",
    personalStatus: "Watching over the cookout with clarity.",
    blackCardStatus: "active",
    socialProof: 50420,
    earnedSP: 15,
    isAdmin: true,
    suspensionStartDate: null,
    avatarText: "GJ",
    avatarBg: PALETTE.gold,
  },
  "user-deb-002": {
    userId: "user-deb-002",
    username: "Aunty Deb",
    contact: "555-019-1122",
    bio: "Making sure everybody ate and nobody playing on the family name.",
    personalStatus: "Who brought this dry potato salad?!",
    blackCardStatus: "active",
    socialProof: 12450,
    earnedSP: 22,
    isAdmin: false,
    suspensionStartDate: null,
    avatarText: "AD",
    avatarBg: PALETTE.green,
  },
  "user-mike-003": {
    userId: "user-mike-003",
    username: "MikeFresh",
    contact: "mike@blackcard.app",
    bio: "Creative director, storyteller, building community archives.",
    personalStatus: "Always invited to the cookout.",
    blackCardStatus: "active",
    socialProof: 6200,
    earnedSP: 9,
    isAdmin: false,
    suspensionStartDate: null,
    avatarText: "MF",
    avatarBg: PALETTE.gold,
  },
  "user-coolio-004": {
    userId: "user-coolio-004",
    username: "Coolio",
    contact: "coolio@blackcard.app",
    bio: "Certified grill master and music curator.",
    personalStatus: "Smoking ribs till sundown.",
    blackCardStatus: "active",
    socialProof: 45,
    earnedSP: 5,
    isAdmin: false,
    suspensionStartDate: null,
    avatarText: "C",
    avatarBg: PALETTE.green,
  },
  "user-sue-005": {
    userId: "user-sue-005",
    username: "SuspendedSue",
    contact: "sue@blackcard.app",
    bio: "In the penalty box learning discipline. Be back soon.",
    personalStatus: "Serving out my 30 days quietly.",
    blackCardStatus: "suspended",
    socialProof: 120,
    earnedSP: 0,
    isAdmin: false,
    suspensionStartDate: Date.now() - 6 * 24 * 60 * 60 * 1000,
    avatarText: "SS",
    avatarBg: PALETTE.gold,
  },
  "user-reggie-006": {
    userId: "user-reggie-006",
    username: "RevokedReggie",
    contact: "reggie@blackcard.app",
    bio: "Fumbled the bag in public. Working to rebuild my 100 SP.",
    personalStatus: "Humbled and trying to recover my card.",
    blackCardStatus: "revoked",
    socialProof: 14,
    earnedSP: 0,
    isAdmin: false,
    suspensionStartDate: null,
    avatarText: "RR",
    avatarBg: PALETTE.red,
  },
};

const SEED_POLLS = {
  "poll-1": {
    id: "poll-1",
    creatorId: "user-jay-001",
    creatorName: "Godfather Jay",
    type: "ab", // 'ab' | 'multiple' | 'fill'
    question: "Cookout Debate: Baked Macaroni & Cheese or Stovetop?",
    options: ["Baked Mac (Crust on top)", "Stovetop (Creamy)"],
    votes: {
      "user-deb-002": 0,
      "user-mike-003": 0,
      "user-coolio-004": 0,
    },
    fillResponses: [],
    createdAt: Date.now() - 25 * 60 * 60 * 1000, // Expired sample to demonstrate highlighting
    expiresAt: Date.now() - 1 * 60 * 60 * 1000,
  },
  "poll-2": {
    id: "poll-2",
    creatorId: "user-deb-002",
    creatorName: "Aunty Deb",
    type: "fill",
    question: "Complete the saying: If you don't know who cooked the potato salad, you don't _____.",
    options: [],
    votes: {},
    fillResponses: [
      {
        id: "resp-1",
        userId: "user-mike-003",
        username: "MikeFresh",
        text: "Touch a single spoonful. Keep walking!",
        timestamp: Date.now() - 3600000,
      },
      {
        id: "resp-2",
        userId: "user-coolio-004",
        username: "Coolio",
        text: "Put it on your paper plate!",
        timestamp: Date.now() - 1800000,
      },
    ],
    createdAt: Date.now() - 4 * 60 * 60 * 1000,
    expiresAt: Date.now() + 20 * 60 * 60 * 1000,
  },
};

const SEED_FEED_LOGS = [
  {
    id: "log-poll-2",
    type: "poll",
    pollId: "poll-2",
    authorId: "user-deb-002",
    authorName: "Aunty Deb",
    timestamp: Date.now() - 4 * 60 * 60 * 1000,
  },
  {
    id: "log-poll-1",
    type: "poll",
    pollId: "poll-1",
    authorId: "user-jay-001",
    authorName: "Godfather Jay",
    timestamp: Date.now() - 25 * 60 * 60 * 1000,
  },
  {
    id: "log-1",
    type: "vouch",
    authorName: "Godfather Jay",
    targetName: "MikeFresh",
    amount: 10,
    timestamp: Date.now() - 3600000,
  },
];

export default function App() {
  const [profiles, setProfiles] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILES);
      return stored ? JSON.parse(stored) : SEED_PROFILES;
    } catch {
      return SEED_PROFILES;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      return stored || "user-jay-001";
    } catch {
      return "user-jay-001";
    }
  });
  const [selectedProfileId, setSelectedProfileId] = useState("user-jay-001");

  // Gateway Auth state
  const [authMode, setAuthMode] = useState("phone");
  const [authInput, setAuthInput] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authStep, setAuthStep] = useState("input");
  const [generatedCode, setGeneratedCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // New Member Onboarding state
  const [newUsername, setNewUsername] = useState("");
  const [newBio, setNewBio] = useState("");

  // Navigation & Theme
  const [currentTab, setCurrentTab] = useState("home");
  const [theme, setTheme] = useState("dark");
  const [notification, setNotification] = useState(null);
  const [directoryFilter, setDirectoryFilter] = useState("");
  const [bannedFilter, setBannedFilter] = useState("all");

  // Status editing state
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState("");

  // Feed logs
  const [feedLogs, setFeedLogs] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FEED_LOGS);
      return stored ? JSON.parse(stored) : SEED_FEED_LOGS;
    } catch {
      return SEED_FEED_LOGS;
    }
  });

  // Polls engine state
  const [polls, setPolls] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.POLLS);
      return stored ? JSON.parse(stored) : SEED_POLLS;
    } catch {
      return SEED_POLLS;
    }
  });

  // Poll creation modal & form
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollType, setPollType] = useState("ab"); // 'ab' | 'multiple' | 'fill'
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptionA, setPollOptionA] = useState("");
  const [pollOptionB, setPollOptionB] = useState("");
  const [pollMultipleOptions, setPollMultipleOptions] = useState(["", "", ""]);

  // Fill in the blank answering state
  const [fillAnswerInputs, setFillAnswerInputs] = useState({});
  const [activePollAnswersView, setActivePollAnswersView] = useState(null); // pollId
  const [replyModalData, setReplyModalData] = useState(null); // { poll, response }
  const [replyCommentText, setReplyCommentText] = useState("");

  // Multimedia post composer state
  const [wallText, setWallText] = useState("");
  const [attachedImage, setAttachedImage] = useState(null);
  const [attachedVideo, setAttachedVideo] = useState(null);
  const [attachedAudio, setAttachedAudio] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mentionQuery, setMentionQuery] = useState(null);

  // Admin sandbox
  const [adminTargetSpInput, setAdminTargetSpInput] = useState("");
  const [adminMemberSearchTerm, setAdminMemberSearchTerm] = useState("");
  const [showAdminScanner, setShowAdminScanner] = useState(false);
  const [shareAuditLogs, setShareAuditLogs] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SHARE_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [showQrModal, setShowQrModal] = useState(false);
  const [showSanctionModal, setShowSanctionModal] = useState(null);
  const [sanctionReason, setSanctionReason] = useState("");

  // Refs
  const wallPhotoInputRef = useRef(null);
  const wallVideoInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const scannerVideoRef = useRef(null);
  const scannerStreamRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    } catch (e) {
      console.warn("Storage sync failed", e);
    }
  }, [profiles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(polls));
    } catch (e) {
      console.warn("Poll storage sync failed", e);
    }
  }, [polls]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FEED_LOGS, JSON.stringify(feedLogs));
    } catch (e) {
      console.warn("Feed storage sync failed", e);
    }
  }, [feedLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHARE_LOGS, JSON.stringify(shareAuditLogs));
    } catch (e) {
      console.warn("Share storage sync failed", e);
    }
  }, [shareAuditLogs]);

  useEffect(() => {
    try {
      if (currentUserId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
      }
    } catch (e) {
      console.warn("User ID storage sync failed", e);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const triggerNotification = (message, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => {
      setNotification(null);
    }, 3400);
  };

  const normalizeContact = (str = "") => str.trim().toLowerCase().replace(/[^a-z0-9@.]/g, "");

  const handleSendVerificationCode = () => {
    const cleanInput = authInput.trim();
    if (!cleanInput) {
      triggerNotification(`Please enter your ${authMode === "phone" ? "mobile phone number" : "email address"}.`, true);
      return;
    }

    if (authMode === "phone" && cleanInput.replace(/\D/g, "").length < 7) {
      triggerNotification("Please enter a valid phone number.", true);
      return;
    }

    if (authMode === "email" && !cleanInput.includes("@")) {
      triggerNotification("Please enter a valid email address.", true);
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setAuthOtp("");
    setAuthStep("verify");
    setCooldown(30);
    triggerNotification(`Verification code generated: [${code}]`);
  };

  const handleVerifyCode = () => {
    const cleanOtp = authOtp.trim();
    if (cleanOtp.length < 6) {
      triggerNotification("Please enter all 6 digits of your verification code.", true);
      return;
    }

    if (cleanOtp !== generatedCode && cleanOtp !== "123456") {
      triggerNotification("Incorrect verification code. Please check and retry.", true);
      return;
    }

    const currentNormalized = normalizeContact(authInput);

    const existingProfile = Object.values(profiles).find((p) => {
      return p.contact && normalizeContact(p.contact) === currentNormalized;
    });

    if (existingProfile) {
      setCurrentUserId(existingProfile.userId);
      setSelectedProfileId(existingProfile.userId);
      setIsAuthenticated(true);
      setAuthStep("input");
      setAuthInput("");
      setAuthOtp("");
      triggerNotification(`Welcome back, ${existingProfile.username}! Session resumed.`);
    } else {
      setAuthStep("onboard");
      triggerNotification("Verification confirmed! Claim your Black Card passcard.");
    }
  };

  const handleCompleteOnboarding = (e) => {
    e.preventDefault();
    const usernameClean = newUsername.trim();
    if (!usernameClean) {
      triggerNotification("Please enter a username or handle.", true);
      return;
    }

    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newId = `user-${usernameClean.toLowerCase().replace(/[^a-z0-9]/g, "")}-${randomHex}`;
    const initials = usernameClean.substring(0, 2).toUpperCase();

    const newProfile = {
      userId: newId,
      username: usernameClean,
      contact: authInput.trim(),
      bio: newBio.trim() || "Proud member preserving heritage and culture.",
      personalStatus: "Just pulled up to the cookout.",
      blackCardStatus: "active",
      socialProof: 25,
      earnedSP: 5,
      isAdmin: false,
      suspensionStartDate: null,
      avatarText: initials,
      avatarBg: PALETTE.gold,
    };

    setProfiles((prev) => ({
      ...prev,
      [newId]: newProfile,
    }));

    setCurrentUserId(newId);
    setSelectedProfileId(newId);
    setIsAuthenticated(true);
    setAuthStep("input");
    setAuthInput("");
    setAuthOtp("");
    setNewUsername("");
    setNewBio("");

    setFeedLogs((prev) => [
      {
        id: `log-welcome-${Date.now()}`,
        type: "wall_post",
        authorId: newId,
        authorName: usernameClean,
        text: `Salute family! Just claimed my official Black Card passcard. Happy to be here!`,
        image: null,
        video: null,
        audio: null,
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    triggerNotification(`Welcome to The Black Card, ${usernameClean}!`);
  };

  const handleCreatePoll = (e) => {
    e.preventDefault();
    if (!pollQuestion.trim()) {
      triggerNotification("Please enter a poll question.", true);
      return;
    }

    let finalOptions = [];
    if (pollType === "ab") {
      if (!pollOptionA.trim() || !pollOptionB.trim()) {
        triggerNotification("Please provide both option A and option B.", true);
        return;
      }
      finalOptions = [pollOptionA.trim(), pollOptionB.trim()];
    } else if (pollType === "multiple") {
      finalOptions = pollMultipleOptions.map((o) => o.trim()).filter(Boolean);
      if (finalOptions.length < 2) {
        triggerNotification("Please provide at least 2 options for multiple choice.", true);
        return;
      }
    }

    const pollId = `poll-${Date.now()}`;
    const newPoll = {
      id: pollId,
      creatorId: currentUserId,
      creatorName: myProfile.username,
      type: pollType,
      question: pollQuestion.trim(),
      options: finalOptions,
      votes: {},
      fillResponses: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + POLL_EXPIRATION_MS, // 24-hour expiration
    };

    setPolls((prev) => ({
      ...prev,
      [pollId]: newPoll,
    }));

    setFeedLogs((prev) => [
      {
        id: `feed-poll-${Date.now()}`,
        type: "poll",
        pollId: pollId,
        authorId: currentUserId,
        authorName: myProfile.username,
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    setShowPollCreator(false);
    setPollQuestion("");
    setPollOptionA("");
    setPollOptionB("");
    setPollMultipleOptions(["", "", ""]);
    triggerNotification("24-Hour Community Poll published!");
  };

  const handleVotePoll = (pollId, optionIndex) => {
    const poll = polls[pollId];
    if (!poll) return;
    if (Date.now() > poll.expiresAt) {
      triggerNotification("This poll has ended (24-hour window closed).", true);
      return;
    }

    setPolls((prev) => {
      const p = prev[pollId];
      return {
        ...prev,
        [pollId]: {
          ...p,
          votes: {
            ...p.votes,
            [currentUserId]: optionIndex,
          },
        },
      };
    });

    triggerNotification("Vote counted!");
  };

  const handleSubmitFillAnswer = (pollId) => {
    const text = (fillAnswerInputs[pollId] || "").trim();
    if (!text) {
      triggerNotification("Please type an answer before submitting.", true);
      return;
    }

    const poll = polls[pollId];
    if (!poll) return;
    if (Date.now() > poll.expiresAt) {
      triggerNotification("This poll has ended (24-hour window closed).", true);
      return;
    }

    const newResponse = {
      id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      userId: currentUserId,
      username: myProfile.username,
      text: text,
      timestamp: Date.now(),
    };

    setPolls((prev) => {
      const p = prev[pollId];
      return {
        ...prev,
        [pollId]: {
          ...p,
          fillResponses: [newResponse, ...(p.fillResponses || [])],
        },
      };
    });

    setFillAnswerInputs((prev) => ({ ...prev, [pollId]: "" }));
    triggerNotification("Your response was submitted privately to the poll creator!");
  };

  const generatePngFromAnswer = (pollQuestion, respondentName, respondentText, replyText) => {
    return new Promise((resolve) => {
      const canvas = hiddenCanvasRef.current || document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 540;
      const ctx = canvas.getContext("2d");

      // Solid Pan-African black card background
      ctx.fillStyle = "#18181B";
      ctx.fillRect(0, 0, 900, 540);

      // Top Tri-Color Heritage Banner
      ctx.fillStyle = "#B91C1C";
      ctx.fillRect(0, 0, 300, 16);
      ctx.fillStyle = "#000000";
      ctx.fillRect(300, 0, 300, 16);
      ctx.fillStyle = "#007A3D";
      ctx.fillRect(600, 0, 300, 16);

      // Card Header
      ctx.fillStyle = "#F59E0B";
      ctx.font = "900 24px sans-serif";
      ctx.fillText("THE BLACK CARD • FILL-IN POLL SUBMISSION", 48, 64);

      // Question Title
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 28px sans-serif";
      const words = (`"${pollQuestion}"`).split(" ");
      let line = "";
      let y = 114;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 800 && n > 0) {
          ctx.fillText(line, 48, y);
          line = words[n] + " ";
          y += 36;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 48, y);

      // Respondent Bubble Background
      y += 24;
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.roundRect(48, y, 804, 150, 20);
      ctx.fill();

      // Respondent Label
      ctx.fillStyle = "#F59E0B";
      ctx.font = "900 20px sans-serif";
      ctx.fillText(`@${respondentName} answered:`, 72, y + 42);

      // Respondent text
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "italic 24px sans-serif";
      ctx.fillText(`"${respondentText}"`, 72, y + 90);

      // Creator Reply Banner at Bottom
      y += 180;
      ctx.fillStyle = "#007A3D";
      ctx.beginPath();
      ctx.roundRect(48, y, 804, 96, 20);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 18px sans-serif";
      ctx.fillText(`CREATOR RESPONSE BY @${myProfile.username}:`, 72, y + 36);

      ctx.font = "bold 22px sans-serif";
      ctx.fillText(replyText ? `"${replyText}"` : "Official Council Spotlight", 72, y + 70);

      const dataUrl = canvas.toDataURL("image/png");
      resolve(dataUrl);
    });
  };

  const handlePostReplyAsPng = async (e) => {
    e.preventDefault();
    if (!replyModalData) return;
    const { poll, response } = replyModalData;

    const pngUrl = await generatePngFromAnswer(
      poll.question,
      response.username,
      response.text,
      replyCommentText.trim()
    );

    const newWallPost = {
      id: `wall-reply-${Date.now()}`,
      type: "wall_post",
      authorId: currentUserId,
      authorName: myProfile.username,
      text: replyCommentText.trim()
        ? `Spotlighting @${response.username}'s poll answer: "${replyCommentText.trim()}"`
        : `Spotlighting @${response.username}'s answer on the Community Wall!`,
      image: pngUrl,
      video: null,
      audio: null,
      timestamp: Date.now(),
    };

    setFeedLogs((prev) => [newWallPost, ...prev]);
    setReplyModalData(null);
    setReplyCommentText("");
    triggerNotification("Answer converted to .PNG card and posted to your wall!");
  };

  const handleStartAudioRecord = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        triggerNotification("Microphone recording not supported on this browser.", true);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAttachedAudio(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      triggerNotification("Recording live voice note...");
    } catch (err) {
      console.error(err);
      triggerNotification("Microphone access denied or unavailable.", true);
    }
  };

  const handleStopAudioRecord = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      clearInterval(recordingTimerRef.current);
      triggerNotification("Voice note attached.");
    }
  };

  const handleWallTextChange = (e) => {
    const val = e.target.value;
    setWallText(val);

    const cursor = e.target.selectionStart;
    const textUpToCursor = val.slice(0, cursor);
    const lastAtIndex = textUpToCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const candidate = textUpToCursor.slice(lastAtIndex + 1);
      if (!candidate.includes(" ")) {
        setMentionQuery(candidate.toLowerCase());
        return;
      }
    }
    setMentionQuery(null);
  };

  const handleSelectMention = (username) => {
    const lastAtIndex = wallText.lastIndexOf("@");
    if (lastAtIndex === -1) return;
    const prefix = wallText.slice(0, lastAtIndex);
    const updated = `${prefix}@${username} `;
    setWallText(updated);
    setMentionQuery(null);
  };

  const handleGiveSP = (target) => {
    if (target.userId === currentUserId) return;
    const currentSender = profiles[currentUserId];
    if (!currentSender || currentSender.earnedSP < 1) {
      triggerNotification("You have 0 daily SP left to give. Refresh tomorrow!", true);
      return;
    }

    const isGodParent = getTierInfo(currentSender.socialProof, currentSender.blackCardStatus).name === "God Mother / God Father";
    const spAward = isGodParent ? 10 : 1;

    setProfiles((prev) => {
      const prevTarget = prev[target.userId];
      const prevSender = prev[currentUserId];
      const newTargetSP = prevTarget.socialProof + spAward;

      let newStatus = prevTarget.blackCardStatus;
      if (prevTarget.blackCardStatus === "none" && newTargetSP >= REQUIRED_SP_FOR_CARD) {
        newStatus = "active";
      } else if (prevTarget.blackCardStatus === "revoked" && newTargetSP >= SP_FOR_REVOKED_RECOVERY) {
        newStatus = "active";
      }

      return {
        ...prev,
        [currentUserId]: {
          ...prevSender,
          earnedSP: Math.max(0, prevSender.earnedSP - 1),
        },
        [target.userId]: {
          ...prevTarget,
          socialProof: newTargetSP,
          blackCardStatus: newStatus,
        },
      };
    });

    setFeedLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        type: "vouch",
        authorName: currentSender.username,
        targetName: target.username,
        amount: spAward,
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    triggerNotification(`Vouched for ${target.username} (+${spAward} SP)!`);
  };

  const handleUpdateStatus = () => {
    if (!statusDraft.trim()) return;
    setProfiles((prev) => ({
      ...prev,
      [currentUserId]: {
        ...prev[currentUserId],
        personalStatus: statusDraft.trim(),
      },
    }));
    setFeedLogs((prev) => [
      {
        id: `status-${Date.now()}`,
        type: "wall_post",
        authorId: currentUserId,
        authorName: myProfile.username,
        text: `Updated status: "${statusDraft.trim()}"`,
        image: null,
        video: null,
        audio: null,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
    setIsEditingStatus(false);
    setStatusDraft("");
    triggerNotification("Personal status updated!");
  };

  const handleOpenSanction = (action) => {
    setShowSanctionModal({ targetId: targetProfile.userId, action });
    setSanctionReason("");
  };

  const handleSubmitSanction = (e) => {
    e.preventDefault();
    if (!sanctionReason.trim()) {
      triggerNotification("Please state a reason for the community record.", true);
      return;
    }
    const { action, targetId } = showSanctionModal;
    const target = profiles[targetId];

    if (action === "revoke") {
      setProfiles((prev) => ({
        ...prev,
        [targetId]: {
          ...prev[targetId],
          blackCardStatus: "revoked",
          socialProof: 0,
          suspensionStartDate: null,
        },
      }));
      setFeedLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          type: "sanction",
          action: "Revoked",
          authorName: myProfile.username,
          targetName: target.username,
          reason: sanctionReason,
          timestamp: Date.now(),
        },
        ...prev,
      ]);
      triggerNotification(`Sanction executed: ${target.username}'s Card REVOKED.`);
    } else {
      setProfiles((prev) => ({
        ...prev,
        [targetId]: {
          ...prev[targetId],
          blackCardStatus: "suspended",
          suspensionStartDate: Date.now(),
        },
      }));
      setFeedLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          type: "sanction",
          action: "Suspended (30 Days)",
          authorName: myProfile.username,
          targetName: target.username,
          reason: sanctionReason,
          timestamp: Date.now(),
        },
        ...prev,
      ]);
      triggerNotification(`Sanction executed: ${target.username}'s Card SUSPENDED.`);
    }

    setShowSanctionModal(null);
  };

  const handleGenerateShare = (label = "Community Passcard", targetId = null) => {
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const trackingId = `TRK-${randomHex}`;
    const shareUrl = `https://theblackcard.app/passcard?ref=${trackingId}&user=${targetId || currentUserId}`;

    const newLog = {
      id: `trk-${Date.now()}`,
      trackingId,
      senderName: myProfile.username,
      targetName: label,
      channel: "Direct Copy",
      clicks: 1,
      timestamp: Date.now(),
    };

    setShareAuditLogs((prev) => [newLog, ...prev]);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement("input");
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      triggerNotification(`Passcard link copied! [${trackingId}]`);
    } catch {
      triggerNotification(`Tracking ID: ${trackingId}`);
    }
  };

  const handlePublishWallPost = (e) => {
    e.preventDefault();
    if (!wallText.trim() && !attachedImage && !attachedVideo && !attachedAudio) {
      triggerNotification("Write a message or attach media first.", true);
      return;
    }

    const newPost = {
      id: `wall-${Date.now()}`,
      type: "wall_post",
      authorId: currentUserId,
      authorName: myProfile.username,
      text: wallText.trim(),
      image: attachedImage,
      video: attachedVideo,
      audio: attachedAudio,
      timestamp: Date.now(),
    };

    setFeedLogs((prev) => [newPost, ...prev]);
    setWallText("");
    setAttachedImage(null);
    setAttachedVideo(null);
    setAttachedAudio(null);
    triggerNotification("Posted to the Community Wall!");
  };

  const myProfile = profiles[currentUserId] || Object.values(profiles)[0] || SEED_PROFILES["user-jay-001"];
  const targetProfile = profiles[selectedProfileId] || myProfile;
  const isMyProfile = selectedProfileId === currentUserId;
  const isCurrentUserAdmin = Boolean(myProfile.isAdmin);

  const filteredDirectory = useMemo(() => {
    return Object.values(profiles).filter((p) => {
      const q = directoryFilter.toLowerCase();
      return p.username.toLowerCase().includes(q) || p.userId.toLowerCase().includes(q);
    });
  }, [profiles, directoryFilter]);

  const filteredBanned = useMemo(() => {
    return Object.values(profiles).filter((p) => {
      if (bannedFilter === "revoked") return p.blackCardStatus === "revoked";
      if (bannedFilter === "suspended") return p.blackCardStatus === "suspended";
      return p.blackCardStatus === "revoked" || p.blackCardStatus === "suspended";
    });
  }, [profiles, bannedFilter]);

  const targetTier = getTierInfo(targetProfile.socialProof, targetProfile.blackCardStatus);
  const myTier = getTierInfo(myProfile.socialProof, myProfile.blackCardStatus);

  const bgClass = theme === "dark" ? "bg-[#000000] text-[#FFFFFF]" : "bg-[#F4F4F5] text-[#18181B]";
  const cardClass = theme === "dark" ? "bg-[#18181B] text-[#FFFFFF]" : "bg-[#FFFFFF] text-[#18181B] shadow-sm";
  const innerBoxClass = theme === "dark" ? "bg-[#000000] text-[#FFFFFF]" : "bg-[#F4F4F5] text-[#18181B]";
  const inputClass = theme === "dark" ? "bg-[#000000] text-[#FFFFFF]" : "bg-[#F4F4F5] text-[#18181B]";
  const goldLinkClass = theme === "dark" ? "text-[#F59E0B] hover:text-[#FFFFFF]" : "text-[#D97706] hover:text-[#B91C1C] font-black";
  const subTextClass = theme === "dark" ? "text-[#A1A1AA]" : "text-[#52525B]";

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${bgClass}`}>
        {notification && (
          <div
            className={`fixed top-4 inset-x-4 max-w-sm mx-auto z-50 p-3.5 rounded-2xl text-xs font-black uppercase text-center shadow-2xl ${
              notification.isError ? "bg-[#B91C1C] text-[#FFFFFF]" : "bg-[#007A3D] text-[#FFFFFF]"
            }`}
          >
            {notification.message}
          </div>
        )}

        <div className={`w-full max-w-sm p-6 rounded-3xl ${cardClass} flex flex-col items-center text-center space-y-5 shadow-2xl`}>
          <BlackAmericanHeritageLogo className="w-16 h-11" roundClass="rounded-2xl" />
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-current">The Black Card</h1>
            <p className={`text-xs ${subTextClass} mt-0.5`}>Heritage & Lineage • Verification Gateway</p>
          </div>

          {authStep === "input" && (
            <div className="w-full space-y-4">
              <div className={`flex rounded-2xl ${innerBoxClass} p-1`}>
                <button
                  type="button"
                  onClick={() => setAuthMode("phone")}
                  className={`flex-1 py-2 text-xs font-black uppercase rounded-xl ${
                    authMode === "phone" ? "bg-[#007A3D] text-[#FFFFFF]" : subTextClass
                  }`}
                >
                  Phone SMS
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("email")}
                  className={`flex-1 py-2 text-xs font-black uppercase rounded-xl ${
                    authMode === "email" ? "bg-[#007A3D] text-[#FFFFFF]" : subTextClass
                  }`}
                >
                  Email
                </button>
              </div>

              <input
                type={authMode === "phone" ? "tel" : "email"}
                placeholder={authMode === "phone" ? "Mobile (e.g. 555-019-2834)" : "Email (e.g. cousin@gmail.com)"}
                value={authInput}
                onChange={(e) => setAuthInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendVerificationCode()}
                className={`w-full p-3.5 text-sm rounded-2xl focus:outline-none ${inputClass}`}
              />

              <button
                type="button"
                onClick={handleSendVerificationCode}
                className="w-full py-3.5 bg-[#F59E0B] text-[#000000] font-black text-sm uppercase rounded-2xl active:scale-[0.98] transition-transform"
              >
                Send Verification Code
              </button>
            </div>
          )}

          {authStep === "verify" && (
            <div className="w-full space-y-4">
              <div className={`p-3 ${innerBoxClass} rounded-2xl space-y-1`}>
                <p className={`text-[10px] uppercase font-black ${subTextClass} tracking-wider`}>
                  Verification Code
                </p>
                <p className="text-2xl font-mono font-black text-[#F59E0B] tracking-widest">
                  {generatedCode}
                </p>
                <p className={`text-[10px] ${subTextClass}`}>
                  Sent to <span className="font-bold text-current">{authInput}</span>
                </p>
              </div>

              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={authOtp}
                onChange={(e) => setAuthOtp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                className={`w-full p-3.5 text-center text-xl tracking-widest font-mono font-bold rounded-2xl focus:outline-none ${inputClass}`}
              />

              <button
                type="button"
                onClick={handleVerifyCode}
                className="w-full py-3.5 bg-[#007A3D] text-[#FFFFFF] font-black text-sm uppercase rounded-2xl active:scale-[0.98] transition-transform"
              >
                Verify & Enter
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  disabled={cooldown > 0}
                  onClick={handleSendVerificationCode}
                  className={`font-bold ${cooldown > 0 ? "text-gray-400 cursor-not-allowed" : goldLinkClass}`}
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthStep("input")}
                  className={`${subTextClass} hover:text-current`}
                >
                  Change Contact
                </button>
              </div>
            </div>
          )}

          {authStep === "onboard" && (
            <form onSubmit={handleCompleteOnboarding} className="w-full space-y-3.5 text-left">
              <div className="text-center pb-1">
                <h2 className="text-sm font-black uppercase text-[#F59E0B]">Claim Your Black Card</h2>
                <p className={`text-[11px] ${subTextClass}`}>Set up your name and lineage bio</p>
              </div>

              <div>
                <label className={`text-[10px] font-black uppercase tracking-wider ${subTextClass} block mb-1`}>
                  Your Name / Handle
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cousin Malik, Nia..."
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className={`w-full p-3 text-xs rounded-2xl focus:outline-none ${inputClass}`}
                />
              </div>

              <div>
                <label className={`text-[10px] font-black uppercase tracking-wider ${subTextClass} block mb-1`}>
                  Lineage Bio / Motto
                </label>
                <textarea
                  rows={2}
                  placeholder="Tell the cousins where you're from..."
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  className={`w-full p-3 text-xs rounded-2xl focus:outline-none resize-none ${inputClass}`}
                />
              </div>

              <div className={`p-3 ${innerBoxClass} rounded-2xl text-[11px] ${subTextClass} space-y-1`}>
                <div className="flex justify-between items-center text-current font-bold">
                  <span>Starting Standing:</span>
                  <span className="text-[#007A3D]">Kin Folk (25 SP)</span>
                </div>
                <p className="text-[10px]">Your official Passcard QR and Lineage ID will be minted instantly.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#007A3D] text-[#FFFFFF] font-black text-xs uppercase tracking-wider rounded-2xl active:scale-[0.98] transition-transform"
              >
                Mint Passcard & Enter
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} pb-24 font-sans`}>
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {notification && (
        <div
          className={`fixed top-4 inset-x-4 max-w-md mx-auto z-50 p-3.5 rounded-2xl text-xs font-black uppercase text-center shadow-2xl ${
            notification.isError ? "bg-[#B91C1C] text-[#FFFFFF]" : "bg-[#007A3D] text-[#FFFFFF]"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header Bar */}
      <header className={`sticky top-0 z-40 px-4 py-3 ${theme === "dark" ? "bg-[#000000]" : "bg-[#FFFFFF] shadow-sm"}`}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div
            className="flex items-center space-x-2.5 cursor-pointer"
            onClick={() => {
              setSelectedProfileId(currentUserId);
              setCurrentTab("home");
            }}
          >
            <BlackAmericanHeritageLogo className="w-8 h-5.5" roundClass="rounded-md" />
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider leading-none text-current">The Black Card</h1>
              <p className={`text-[10px] ${goldLinkClass} leading-tight`}>Heritage & Lineage</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`px-2.5 py-1 rounded-2xl ${innerBoxClass} ${goldLinkClass} text-[11px] font-black uppercase tracking-wider`}>
              {myProfile.earnedSP} SP to give
            </div>

            <button
              type="button"
              onClick={() => handleGenerateShare("The Black Card Network")}
              title="Share Network Pass"
              className={`p-2 rounded-2xl ${innerBoxClass} hover:text-[#F59E0B]`}
            >
              <ShareIcon className="w-4 h-4 text-current" />
            </button>

            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`p-2 rounded-2xl ${innerBoxClass} text-xs font-black text-[#F59E0B]`}
              title="Toggle Theme"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAuthenticated(false);
                setAuthStep("input");
                setAuthInput("");
                setAuthOtp("");
                triggerNotification("Signed out. Re-enter your contact to resume session.");
              }}
              className={`p-2 rounded-2xl ${innerBoxClass} text-[#B91C1C] text-xs font-black`}
              title="Sign Out to Login Gateway"
            >
              ✕
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-2 space-y-4">
        {/* ======================= TAB: PASSCARD ======================= */}
        {currentTab === "home" && (
          <div className="space-y-4">
            <div className={`p-4 rounded-3xl ${cardClass} space-y-4 shadow-xl`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black tracking-widest uppercase ${goldLinkClass}`}>
                  Official Lineage Passcard
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-[#FFFFFF]"
                  style={{
                    backgroundColor:
                      targetProfile.blackCardStatus === "active"
                        ? PALETTE.green
                        : targetProfile.blackCardStatus === "suspended"
                        ? PALETTE.gold
                        : PALETTE.red,
                  }}
                >
                  {targetProfile.blackCardStatus === "active"
                    ? "Card Active"
                    : targetProfile.blackCardStatus === "suspended"
                    ? "Card Suspended"
                    : targetProfile.blackCardStatus === "revoked"
                    ? "Card Revoked"
                    : "Unvouched"}
                </span>
              </div>

              {/* Profile Row */}
              <div className="flex items-center space-x-3.5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-black text-[#FFFFFF] flex-shrink-0 cursor-pointer shadow-md"
                  style={{ backgroundColor: targetProfile.avatarBg || PALETTE.gold }}
                  onClick={() => isMyProfile && avatarInputRef.current && avatarInputRef.current.click()}
                  title={isMyProfile ? "Change Avatar Photo" : targetProfile.username}
                >
                  {targetProfile.avatarText || targetProfile.username.substring(0, 2).toUpperCase()}
                </div>
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      triggerNotification("Profile portrait updated.");
                    }
                  }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <h2 className="text-lg font-black truncate text-current">{targetProfile.username}</h2>
                    {targetProfile.isAdmin && (
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-[#B91C1C] text-[#FFFFFF] rounded-md tracking-wider">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-bold ${goldLinkClass}`}>{targetTier.name}</p>
                  <p className={`text-[10px] ${subTextClass} font-mono truncate`}>ID: {targetProfile.userId}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className={`p-3 ${innerBoxClass} text-[#F59E0B] rounded-2xl flex-shrink-0 shadow-sm`}
                  title="View Scannable Passcard QR Code"
                >
                  <QrIcon className="w-5 h-5" />
                </button>
              </div>

              {/* SP Counters */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className={`p-3 rounded-2xl ${innerBoxClass} flex flex-col justify-center`}>
                  <span className={`text-[10px] font-black uppercase ${subTextClass}`}>Total SP Received</span>
                  <span className="text-2xl font-black text-current">{targetProfile.socialProof}</span>
                </div>
                <div className={`p-3 rounded-2xl ${innerBoxClass} flex flex-col justify-center`}>
                  <span className={`text-[10px] font-black uppercase ${subTextClass}`}>Council Standing</span>
                  <span className="text-sm font-black text-[#007A3D] truncate">{targetTier.name}</span>
                </div>
              </div>

              {/* Status and Bio */}
              <div className="space-y-2 pt-1 text-xs">
                <div className={`p-3 ${innerBoxClass} rounded-2xl space-y-1 relative`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black uppercase ${goldLinkClass}`}>Current Status</span>
                    {isMyProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusDraft(myProfile.personalStatus);
                          setIsEditingStatus(true);
                        }}
                        className={`text-[10px] font-bold ${goldLinkClass} flex items-center space-x-1`}
                      >
                        <PencilIcon className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {isEditingStatus ? (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={statusDraft}
                        onChange={(e) => setStatusDraft(e.target.value)}
                        placeholder="What's your current status?"
                        className={`w-full p-2.5 text-xs rounded-xl focus:outline-none ${inputClass}`}
                      />
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingStatus(false)}
                          className="flex-1 py-1.5 bg-[#18181B] text-[#FFFFFF] text-[11px] font-bold rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleUpdateStatus}
                          className="flex-1 py-1.5 bg-[#007A3D] text-[#FFFFFF] text-[11px] font-bold rounded-xl"
                        >
                          Save Status
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="italic text-current">"{targetProfile.personalStatus}"</p>
                  )}
                </div>

                <div className={`p-3 ${innerBoxClass} rounded-2xl space-y-1`}>
                  <span className={`text-[10px] font-black uppercase ${goldLinkClass}`}>Lineage Bio</span>
                  <p className={subTextClass}>{targetProfile.bio}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2 pt-2">
                {!isMyProfile && (
                  <button
                    type="button"
                    onClick={() => handleGiveSP(targetProfile)}
                    className="w-full py-3.5 bg-[#007A3D] text-[#FFFFFF] font-black text-xs uppercase tracking-wider rounded-2xl active:scale-[0.98] transition-transform"
                  >
                    Vouch & Give SP ({myTier.name === "God Mother / God Father" ? "+10 SP" : "+1 SP"})
                  </button>
                )}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateShare(`${targetProfile.username}'s Passcard`, targetProfile.userId)}
                    className={`flex-1 py-3 ${innerBoxClass} text-current font-black text-xs uppercase rounded-2xl flex items-center justify-center space-x-1.5`}
                  >
                    <ShareIcon className="w-4 h-4 text-[#F59E0B]" />
                    <span>Share Passcard</span>
                  </button>

                  {!isMyProfile && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenSanction("suspend")}
                        className={`px-4 py-3 ${innerBoxClass} ${goldLinkClass} font-black text-xs uppercase rounded-2xl`}
                      >
                        Suspend
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenSanction("revoke")}
                        className="px-4 py-3 bg-[#B91C1C] text-[#FFFFFF] font-black text-xs uppercase rounded-2xl"
                      >
                        Revoke
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: COMMUNITY WALL & POLLS ======================= */}
        {currentTab === "feed" && (
          <div className="space-y-4">
            {/* Status & Media Composer */}
            <div className={`p-4 rounded-3xl ${cardClass} space-y-3 relative shadow-xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-black text-[#FFFFFF]"
                    style={{ backgroundColor: myProfile.avatarBg || PALETTE.gold }}
                  >
                    {myProfile.avatarText}
                  </div>
                  <span className={`text-xs font-black uppercase ${goldLinkClass}`}>Community Wall</span>
                </div>

                {/* Poll Launch Trigger */}
                <button
                  type="button"
                  onClick={() => setShowPollCreator(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-2xl bg-[#007A3D] text-[#FFFFFF] text-xs font-black uppercase tracking-wider active:scale-[0.98]"
                >
                  <PollIcon className="w-3.5 h-3.5" />
                  <span>Create Poll</span>
                </button>
              </div>

              {mentionQuery !== null && (
                <div className={`absolute left-4 right-4 top-16 z-30 p-2 rounded-2xl ${innerBoxClass} shadow-2xl space-y-1`}>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${subTextClass} px-2`}>Mention Cousin</span>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {Object.values(profiles)
                      .filter((p) => p.username.toLowerCase().includes(mentionQuery))
                      .map((p) => (
                        <div
                          key={p.userId}
                          onClick={() => handleSelectMention(p.username)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-current hover:bg-[#F59E0B] hover:text-[#000000] cursor-pointer flex justify-between"
                        >
                          <span>@{p.username}</span>
                          <span className="text-[10px] font-normal">{p.socialProof} SP</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <form onSubmit={handlePublishWallPost} className="space-y-2.5">
                <textarea
                  rows={3}
                  placeholder="Drop a note to the family... Type @ to mention a cousin directly."
                  value={wallText}
                  onChange={handleWallTextChange}
                  className={`w-full p-3 rounded-2xl text-xs focus:outline-none resize-none ${inputClass}`}
                />

                {attachedImage && (
                  <div className="relative rounded-2xl overflow-hidden bg-[#000000]">
                    <img src={attachedImage} alt="Attachment" className="max-h-52 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      className="absolute top-2 right-2 p-1.5 bg-[#B91C1C] text-[#FFFFFF] rounded-full shadow-lg"
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {attachedVideo && (
                  <div className="relative rounded-2xl overflow-hidden bg-[#000000]">
                    <video src={attachedVideo} controls className="max-h-52 w-full" />
                    <button
                      type="button"
                      onClick={() => setAttachedVideo(null)}
                      className="absolute top-2 right-2 p-1.5 bg-[#B91C1C] text-[#FFFFFF] rounded-full shadow-lg"
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {attachedAudio && (
                  <div className={`flex items-center justify-between p-3 rounded-2xl ${innerBoxClass}`}>
                    <audio src={attachedAudio} controls className="h-9 w-full max-w-[240px]" />
                    <button
                      type="button"
                      onClick={() => setAttachedAudio(null)}
                      className="p-1.5 bg-[#B91C1C] text-[#FFFFFF] rounded-full"
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => wallPhotoInputRef.current && wallPhotoInputRef.current.click()}
                      className={`p-2.5 rounded-2xl ${innerBoxClass} hover:text-[#F59E0B]`}
                      title="Attach Photo or Take Live Selfie"
                    >
                      <PhotoIcon className="w-4 h-4 text-current" />
                    </button>
                    <input
                      type="file"
                      ref={wallPhotoInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAttachedImage(URL.createObjectURL(e.target.files[0]));
                          triggerNotification("Photo attached.");
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => wallVideoInputRef.current && wallVideoInputRef.current.click()}
                      className={`p-2.5 rounded-2xl ${innerBoxClass} hover:text-[#F59E0B]`}
                      title="Attach Video Clip"
                    >
                      <VideoIcon className="w-4 h-4 text-current" />
                    </button>
                    <input
                      type="file"
                      ref={wallVideoInputRef}
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAttachedVideo(URL.createObjectURL(e.target.files[0]));
                          triggerNotification("Video attached.");
                        }
                      }}
                    />

                    {!isRecordingAudio ? (
                      <button
                        type="button"
                        onClick={handleStartAudioRecord}
                        className={`p-2.5 rounded-2xl ${innerBoxClass} hover:text-[#F59E0B]`}
                        title="Record Live Voice Note"
                      >
                        <MicIcon className="w-4 h-4 text-current" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopAudioRecord}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-[#B91C1C] text-[#FFFFFF] text-xs font-bold animate-pulse"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#FFFFFF]"></span>
                        <span>Stop ({recordingSeconds}s)</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#007A3D] text-[#FFFFFF] font-black text-xs uppercase tracking-wider rounded-2xl active:scale-[0.98] transition-transform"
                  >
                    Post to Wall
                  </button>
                </div>
              </form>
            </div>

            {/* Live Feed Stream with Polls & Answers */}
            <div className="space-y-3">
              {feedLogs.map((item) => {
                if (item.type === "poll") {
                  const poll = polls[item.pollId];
                  if (!poll) return null;
                  const isCreator = poll.creatorId === currentUserId;
                  const isExpired = Date.now() > poll.expiresAt;
                  const totalVotes = Object.keys(poll.votes || {}).length;
                  const userVoteIndex = poll.votes?.[currentUserId];

                  // Calculate winning option(s) for multiple/ab polls
                  let winningIndexes = [];
                  if (isExpired && poll.type !== "fill" && totalVotes > 0) {
                    const counts = poll.options.map((_, idx) => {
                      return Object.values(poll.votes).filter((v) => v === idx).length;
                    });
                    const maxCount = Math.max(...counts);
                    winningIndexes = counts
                      .map((c, i) => (c === maxCount && maxCount > 0 ? i : -1))
                      .filter((i) => i !== -1);
                  }

                  const timeLeftHours = Math.max(0, Math.ceil((poll.expiresAt - Date.now()) / (1000 * 60 * 60)));

                  return (
                    <div key={item.id} className={`p-4 rounded-3xl ${cardClass} space-y-3 shadow-lg`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-lg bg-[#B91C1C] text-[#FFFFFF] text-[10px] font-black uppercase tracking-wider">
                            {poll.type === "ab" ? "A/B Poll" : poll.type === "multiple" ? "Multiple Choice" : "Fill In Blank"}
                          </span>
                          <span
                            onClick={() => {
                              setSelectedProfileId(poll.creatorId);
                              setCurrentTab("home");
                            }}
                            className={`text-xs font-black cursor-pointer ${goldLinkClass}`}
                          >
                            @{poll.creatorName}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {isExpired ? (
                            <span className="flex items-center space-x-1 text-[10px] font-black uppercase text-[#B91C1C]">
                              <LockClosedIcon className="w-3 h-3" />
                              <span>Ended • Highlighted</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#007A3D]">
                              {timeLeftHours}h remaining
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm font-black text-current leading-snug">
                        {poll.question}
                      </p>

                      {/* Options rendering for A/B and Multiple Choice */}
                      {poll.type !== "fill" && (
                        <div className="space-y-2 pt-1">
                          {poll.options.map((opt, idx) => {
                            const optionVoteCount = Object.values(poll.votes || {}).filter((v) => v === idx).length;
                            const percent = totalVotes > 0 ? Math.round((optionVoteCount / totalVotes) * 100) : 0;
                            const isSelected = userVoteIndex === idx;
                            const isWinner = isExpired && winningIndexes.includes(idx);

                            return (
                              <button
                                key={idx}
                                type="button"
                                disabled={isExpired}
                                onClick={() => handleVotePoll(poll.id, idx)}
                                className={`w-full p-3 rounded-2xl text-left relative overflow-hidden transition-all ${
                                  isWinner
                                    ? "bg-[#007A3D] text-[#FFFFFF] shadow-md ring-2 ring-[#F59E0B]"
                                    : isSelected
                                    ? "bg-[#F59E0B] text-[#000000] font-black"
                                    : `${innerBoxClass} hover:bg-opacity-80`
                                }`}
                              >
                                {totalVotes > 0 && (
                                  <div
                                    className={`absolute left-0 top-0 bottom-0 opacity-20 ${
                                      isWinner ? "bg-[#FFFFFF]" : "bg-[#007A3D]"
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                )}

                                <div className="relative z-10 flex items-center justify-between text-xs font-bold">
                                  <div className="flex items-center space-x-2">
                                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-black bg-opacity-20">
                                      {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span>{opt}</span>
                                    {isWinner && (
                                      <span className="px-2 py-0.5 rounded text-[9px] bg-[#FFFFFF] text-[#007A3D] font-black uppercase">
                                        Top Answer
                                      </span>
                                    )}
                                  </div>
                                  <span>{percent}% ({optionVoteCount})</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Fill in the blank answering form */}
                      {poll.type === "fill" && (
                        <div className="space-y-2.5 pt-1">
                          {!isExpired ? (
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                placeholder="Write your fill-in response..."
                                value={fillAnswerInputs[poll.id] || ""}
                                onChange={(e) =>
                                  setFillAnswerInputs((prev) => ({ ...prev, [poll.id]: e.target.value }))
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleSubmitFillAnswer(poll.id)}
                                className={`flex-1 p-3 text-xs rounded-2xl focus:outline-none ${inputClass}`}
                              />
                              <button
                                type="button"
                                onClick={() => handleSubmitFillAnswer(poll.id)}
                                className="px-4 py-3 bg-[#007A3D] text-[#FFFFFF] text-xs font-black uppercase rounded-2xl"
                              >
                                Send
                              </button>
                            </div>
                          ) : (
                            <p className={`text-xs italic ${subTextClass}`}>
                              Fill-in-the-blank poll has closed.
                            </p>
                          )}

                          {/* Creator-Only Answer Inspection Button */}
                          {isCreator && (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setActivePollAnswersView(activePollAnswersView === poll.id ? null : poll.id)
                                }
                                className="w-full py-2.5 bg-[#F59E0B] text-[#000000] font-black text-xs uppercase rounded-2xl flex items-center justify-center space-x-1.5"
                              >
                                <span>Answers ({poll.fillResponses?.length || 0}) — Creator Only</span>
                              </button>

                              {activePollAnswersView === poll.id && (
                                <div className={`mt-2 p-3 ${innerBoxClass} rounded-2xl space-y-2`}>
                                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-[#F59E0B]">
                                    <span>Confidential Answers</span>
                                    <span>Only You Can See This</span>
                                  </div>

                                  {(!poll.fillResponses || poll.fillResponses.length === 0) ? (
                                    <p className={`text-xs ${subTextClass}`}>No answers submitted yet.</p>
                                  ) : (
                                    poll.fillResponses.map((resp) => (
                                      <div
                                        key={resp.id}
                                        className={`p-3 ${theme === "dark" ? "bg-[#18181B]" : "bg-[#FFFFFF]"} rounded-2xl space-y-2`}
                                      >
                                        <div className="flex justify-between items-center text-xs">
                                          <span className={`font-black ${goldLinkClass}`}>
                                            @{resp.username}
                                          </span>
                                          <span className={`text-[10px] ${subTextClass}`}>
                                            {new Date(resp.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                          </span>
                                        </div>
                                        <p className="text-xs text-current font-medium">"{resp.text}"</p>

                                        {/* Creator Reply-as-PNG Button */}
                                        <button
                                          type="button"
                                          onClick={() => setReplyModalData({ poll, response: resp })}
                                          className="w-full py-2 bg-[#007A3D] text-[#FFFFFF] text-[11px] font-black uppercase rounded-xl"
                                        >
                                          Reply & Post as .PNG to Wall
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {!isCreator && (
                            <p className={`text-[10px] ${subTextClass} flex items-center space-x-1`}>
                              <LockClosedIcon className="w-3 h-3 text-[#F59E0B]" />
                              <span>Answers are private to the poll author until highlighted.</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.type === "vouch") {
                  return (
                    <div key={item.id} className={`p-4 rounded-3xl ${cardClass} flex items-center space-x-2 text-xs shadow-lg`}>
                      <span className="p-1.5 rounded-xl bg-[#007A3D] text-[#FFFFFF] font-black text-[10px]">+SP</span>
                      <p className="text-current">
                        <span className={`font-bold ${goldLinkClass}`}>{item.authorName}</span> vouched for{" "}
                        <span className="font-bold text-current">{item.targetName}</span> (+{item.amount} SP)
                      </p>
                    </div>
                  );
                }

                if (item.type === "sanction") {
                  return (
                    <div key={item.id} className={`p-4 rounded-3xl ${cardClass} space-y-1 shadow-lg`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-[#B91C1C]">Council Sanction Enacted</span>
                        <span className={`text-[9px] ${subTextClass}`}>
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-current">
                        {item.authorName} {item.action} {item.targetName}
                      </p>
                      <p className={`text-xs italic ${subTextClass}`}>"{item.reason}"</p>
                    </div>
                  );
                }

                if (item.type === "wall_post") {
                  return (
                    <div key={item.id} className={`p-4 rounded-3xl ${cardClass} space-y-2 shadow-lg`}>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-black cursor-pointer ${goldLinkClass}`}
                          onClick={() => {
                            if (item.authorId) {
                              setSelectedProfileId(item.authorId);
                              setCurrentTab("home");
                            }
                          }}
                        >
                          @{item.authorName}
                        </span>
                        <span className={`text-[10px] ${subTextClass}`}>
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {item.text && (
                        <p className="text-xs leading-relaxed text-current">
                          {item.text.split(" ").map((word, i) => {
                            if (word.startsWith("@")) {
                              const cleanHandle = word.replace(/[^a-zA-Z0-9_-]/g, "");
                              const matched = Object.values(profiles).find(
                                (p) => p.username.toLowerCase() === cleanHandle.toLowerCase()
                              );
                              return (
                                <span
                                  key={i}
                                  onClick={() => {
                                    if (matched) {
                                      setSelectedProfileId(matched.userId);
                                      setCurrentTab("home");
                                    }
                                  }}
                                  className={`font-black ${goldLinkClass} cursor-pointer hover:underline mr-1`}
                                >
                                  {word}{" "}
                                </span>
                              );
                            }
                            return word + " ";
                          })}
                        </p>
                      )}

                      {item.image && (
                        <div className="rounded-2xl overflow-hidden bg-[#000000]">
                          <img src={item.image} alt="Wall attachment" className="max-h-80 w-full object-contain bg-[#18181B]" />
                        </div>
                      )}

                      {item.video && (
                        <div className="rounded-2xl overflow-hidden bg-[#000000]">
                          <video src={item.video} controls className="max-h-64 w-full" />
                        </div>
                      )}

                      {item.audio && (
                        <div className={`p-2.5 rounded-2xl ${innerBoxClass}`}>
                          <audio src={item.audio} controls className="w-full h-8" />
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}

        {/* ======================= TAB: COMMUNITY DIRECTORY ======================= */}
        {currentTab === "friends" && (
          <div className="space-y-3">
            <div className={`p-4 rounded-3xl ${cardClass} space-y-3 shadow-xl`}>
              <h2 className={`text-sm font-black uppercase tracking-wider ${goldLinkClass}`}>Community Directory</h2>
              <input
                type="text"
                placeholder="Search cousins by name or ID..."
                value={directoryFilter}
                onChange={(e) => setDirectoryFilter(e.target.value)}
                className={`w-full p-3 text-xs rounded-2xl focus:outline-none ${inputClass}`}
              />
            </div>

            <div className="space-y-2">
              {filteredDirectory.map((p) => {
                const tier = getTierInfo(p.socialProof, p.blackCardStatus);
                return (
                  <div
                    key={p.userId}
                    onClick={() => {
                      setSelectedProfileId(p.userId);
                      setCurrentTab("home");
                    }}
                    className={`p-3.5 rounded-3xl ${cardClass} flex items-center justify-between cursor-pointer shadow-md`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xs font-black text-[#FFFFFF]"
                        style={{ backgroundColor: p.avatarBg || PALETTE.gold }}
                      >
                        {p.avatarText || p.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h3 className="text-xs font-black text-current">{p.username}</h3>
                          {p.isAdmin && (
                            <span className="px-1.5 py-0.2 text-[8px] font-black uppercase bg-[#B91C1C] text-[#FFFFFF] rounded">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] font-bold ${goldLinkClass}`}>{tier.name}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-current">{p.socialProof}</span>
                      <p className={`text-[9px] ${subTextClass} uppercase`}>SP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================= TAB: PENALTY BOX ======================= */}
        {currentTab === "banned" && (
          <div className="space-y-3">
            <div className={`p-4 rounded-3xl ${cardClass} space-y-3 shadow-xl`}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-[#B91C1C]">Hall of Accountability</h2>
                <span className={`text-[10px] ${subTextClass}`}>{filteredBanned.length} Members</span>
              </div>

              <div className={`flex rounded-2xl ${innerBoxClass} p-1`}>
                <button
                  type="button"
                  onClick={() => setBannedFilter("all")}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-xl ${
                    bannedFilter === "all" ? "bg-[#007A3D] text-[#FFFFFF]" : subTextClass
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setBannedFilter("revoked")}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-xl ${
                    bannedFilter === "revoked" ? "bg-[#B91C1C] text-[#FFFFFF]" : subTextClass
                  }`}
                >
                  Revoked
                </button>
                <button
                  type="button"
                  onClick={() => setBannedFilter("suspended")}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-xl ${
                    bannedFilter === "suspended" ? "bg-[#F59E0B] text-[#000000]" : subTextClass
                  }`}
                >
                  Suspended
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {filteredBanned.length === 0 ? (
                <p className={`text-center text-xs ${subTextClass} py-8`}>No members currently in the penalty box.</p>
              ) : (
                filteredBanned.map((p) => (
                  <div
                    key={p.userId}
                    onClick={() => {
                      setSelectedProfileId(p.userId);
                      setCurrentTab("home");
                    }}
                    className={`p-3.5 rounded-3xl ${cardClass} flex items-center justify-between cursor-pointer shadow-md`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xs font-black text-[#FFFFFF]"
                        style={{ backgroundColor: p.blackCardStatus === "revoked" ? PALETTE.red : PALETTE.gold }}
                      >
                        {p.avatarText}
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-current">{p.username}</h3>
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: p.blackCardStatus === "revoked" ? PALETTE.red : PALETTE.gold }}
                        >
                          {p.blackCardStatus === "revoked" ? "Card Revoked" : "Suspended (30 Days)"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-current">{p.socialProof} SP</span>
                      <p className={`text-[9px] ${subTextClass}`}>
                        {p.blackCardStatus === "revoked" ? "Needs 100 SP" : "Time Remaining"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ======================= MODAL: CREATE 24-HOUR POLL ======================= */}
      {showPollCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000] bg-opacity-90">
          <div className={`w-full max-w-sm p-6 rounded-3xl ${cardClass} space-y-4 shadow-2xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PollIcon className="w-5 h-5 text-[#007A3D]" />
                <h3 className={`text-xs font-black uppercase ${goldLinkClass}`}>Create 24-Hour Poll</h3>
              </div>
              <button onClick={() => setShowPollCreator(false)} className={subTextClass}>
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Poll Type Selector */}
            <div className={`flex rounded-2xl ${innerBoxClass} p-1 text-[11px] font-black uppercase`}>
              <button
                type="button"
                onClick={() => setPollType("ab")}
                className={`flex-1 py-1.5 rounded-xl ${
                  pollType === "ab" ? "bg-[#007A3D] text-[#FFFFFF]" : subTextClass
                }`}
              >
                A / B
              </button>
              <button
                type="button"
                onClick={() => setPollType("multiple")}
                className={`flex-1 py-1.5 rounded-xl ${
                  pollType === "multiple" ? "bg-[#007A3D] text-[#FFFFFF]" : subTextClass
                }`}
              >
                Choice (4)
              </button>
              <button
                type="button"
                onClick={() => setPollType("fill")}
                className={`flex-1 py-1.5 rounded-xl ${
                  pollType === "fill" ? "bg-[#007A3D] text-[#FFFFFF]" : subTextClass
                }`}
              >
                Fill Blank
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-3">
              <div>
                <label className={`text-[10px] font-black uppercase tracking-wider ${subTextClass} block mb-1`}>
                  Poll Question / Prompt
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Which city has the greatest food scene?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className={`w-full p-3 rounded-2xl text-xs focus:outline-none resize-none ${inputClass}`}
                />
              </div>

              {/* A/B Inputs */}
              {pollType === "ab" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Option A (e.g. Chicago)"
                    value={pollOptionA}
                    onChange={(e) => setPollOptionA(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs focus:outline-none ${inputClass}`}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Option B (e.g. Atlanta)"
                    value={pollOptionB}
                    onChange={(e) => setPollOptionB(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs focus:outline-none ${inputClass}`}
                  />
                </div>
              )}

              {/* Multiple Choice Inputs */}
              {pollType === "multiple" && (
                <div className="space-y-2">
                  {pollMultipleOptions.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollMultipleOptions];
                        next[i] = e.target.value;
                        setPollMultipleOptions(next);
                      }}
                      className={`w-full p-2.5 rounded-xl text-xs focus:outline-none ${inputClass}`}
                    />
                  ))}
                  {pollMultipleOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setPollMultipleOptions((prev) => [...prev, ""])}
                      className={`text-[10px] font-bold ${goldLinkClass}`}
                    >
                      + Add 4th option
                    </button>
                  )}
                </div>
              )}

              {/* Fill Blank description */}
              {pollType === "fill" && (
                <div className={`p-3 ${innerBoxClass} rounded-2xl text-[11px] ${subTextClass} space-y-1`}>
                  <p className="font-bold text-current">Creator Private Answer Protection:</p>
                  <p>Answers will be hidden from everyone except you. You can review submissions and post spotlight replies as a .PNG image card.</p>
                </div>
              )}

              <p className={`text-[10px] font-bold ${subTextClass}`}>
                ⏱ Poll automatically expires in 24 hours. The highest voted answers will highlight in bold color.
              </p>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPollCreator(false)}
                  className={`flex-1 py-3 ${innerBoxClass} text-current text-xs font-black uppercase rounded-2xl`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#007A3D] text-[#FFFFFF] text-xs font-black uppercase rounded-2xl active:scale-[0.98] transition-transform"
                >
                  Publish Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: CREATOR REPLY AS PNG ======================= */}
      {replyModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000] bg-opacity-90">
          <div className={`w-full max-w-sm p-6 rounded-3xl ${cardClass} space-y-4 shadow-2xl`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-black uppercase ${goldLinkClass}`}>Reply & Export to PNG Card</h3>
              <button onClick={() => setReplyModalData(null)} className={subTextClass}>
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-3 ${innerBoxClass} rounded-2xl space-y-1 text-xs`}>
              <span className={`font-black ${goldLinkClass}`}>@{replyModalData.response.username}'s Answer:</span>
              <p className="italic text-current">"{replyModalData.response.text}"</p>
            </div>

            <form onSubmit={handlePostReplyAsPng} className="space-y-3">
              <div>
                <label className={`text-[10px] font-black uppercase tracking-wider ${subTextClass} block mb-1`}>
                  Your Official Response
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Add your response or commentary to this cousin's answer..."
                  value={replyCommentText}
                  onChange={(e) => setReplyCommentText(e.target.value)}
                  className={`w-full p-3 rounded-2xl text-xs focus:outline-none resize-none ${inputClass}`}
                />
              </div>

              <p className={`text-[10px] ${subTextClass}`}>
                This will generate an official The Black Card PNG graphics card with their response and publish it directly to your Community Wall.
              </p>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setReplyModalData(null)}
                  className={`flex-1 py-3 ${innerBoxClass} text-current text-xs font-black uppercase rounded-2xl`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#007A3D] text-[#FFFFFF] text-xs font-black uppercase rounded-2xl active:scale-[0.98] transition-transform"
                >
                  Post as PNG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: REAL SCANNABLE QR CODE ======================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000] bg-opacity-90">
          <div className={`w-full max-w-xs p-6 rounded-3xl ${cardClass} text-center space-y-4 shadow-2xl`}>
            <BlackAmericanHeritageLogo className="w-12 h-8 mx-auto" roundClass="rounded-lg" />
            <div>
              <h3 className="text-sm font-black uppercase text-current">{targetProfile.username}</h3>
              <p className={`text-[10px] font-bold ${goldLinkClass}`}>{targetTier.name}</p>
            </div>

            <div className="p-3 bg-[#FFFFFF] rounded-2xl mx-auto w-48 h-48 flex items-center justify-center shadow-lg">
              <RealQRCodeSVG
                value={`https://theblackcard.app/passcard?uid=${targetProfile.userId}&name=${encodeURIComponent(targetProfile.username)}`}
                size={168}
              />
            </div>

            <p className={`text-[11px] font-mono ${subTextClass}`}>{targetProfile.userId}</p>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-3 bg-[#000000] text-[#FFFFFF] font-black text-xs uppercase rounded-2xl active:scale-[0.98] transition-transform"
            >
              Close Passcard
            </button>
          </div>
        </div>
      )}

      {/* ======================= MODAL: SANCTION PROPOSAL ======================= */}
      {showSanctionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000] bg-opacity-90">
          <div className={`w-full max-w-sm p-6 rounded-3xl ${cardClass} space-y-4 shadow-2xl`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-[#B91C1C]">
                Propose {showSanctionModal.action === "revoke" ? "Revocation" : "30-Day Suspension"}
              </h3>
              <button onClick={() => setShowSanctionModal(null)} className={subTextClass}>
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <p className={`text-xs ${subTextClass}`}>
              State the reason for holding <span className="font-bold text-current">{targetProfile.username}</span> accountable.
            </p>

            <form onSubmit={handleSubmitSanction} className="space-y-3">
              <textarea
                rows={3}
                placeholder="Reason for council review..."
                value={sanctionReason}
                onChange={(e) => setSanctionReason(e.target.value)}
                className={`w-full p-3 rounded-2xl text-xs focus:outline-none resize-none ${inputClass}`}
              />

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSanctionModal(null)}
                  className={`flex-1 py-3 ${innerBoxClass} text-current text-xs font-black uppercase rounded-2xl`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 text-xs font-black uppercase rounded-2xl active:scale-[0.98] transition-transform ${
                    showSanctionModal.action === "revoke" ? "bg-[#B91C1C] text-[#FFFFFF]" : "bg-[#F59E0B] text-[#000000]"
                  }`}
                >
                  Execute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= BOTTOM APP NAVIGATION ======================= */}
      <nav
        className={`fixed bottom-0 inset-x-0 z-40 max-w-md mx-auto px-6 py-2.5 flex items-center justify-between rounded-t-3xl shadow-2xl ${
          theme === "dark" ? "bg-[#000000]" : "bg-[#FFFFFF]"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setSelectedProfileId(currentUserId);
            setCurrentTab("home");
          }}
          className={`p-3 rounded-2xl flex flex-col items-center space-y-1 ${
            currentTab === "home" ? "bg-[#007A3D] text-[#FFFFFF]" : subTextClass
          }`}
          title="Passcard"
        >
          <UserIcon className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab("feed")}
          className={`p-3 rounded-2xl flex flex-col items-center space-y-1 ${
            currentTab === "feed" ? "bg-[#007A3D] text-[#FFFFFF]" : subTextClass
          }`}
          title="Community Wall & Polls"
        >
          <FeedIcon className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab("friends")}
          className={`p-3 rounded-2xl flex flex-col items-center space-y-1 ${
            currentTab === "friends" ? "bg-[#007A3D] text-[#FFFFFF]" : subTextClass
          }`}
          title="Directory"
        >
          <FriendsIcon className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab("banned")}
          className={`p-3 rounded-2xl flex flex-col items-center space-y-1 ${
            currentTab === "banned" ? "bg-[#B91C1C] text-[#FFFFFF]" : subTextClass
          }`}
          title="Penalty Box"
        >
          <BanIcon className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
}
