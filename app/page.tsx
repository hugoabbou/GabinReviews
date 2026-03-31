"use client";

import { useState, useEffect } from "react";



type Platform = "google" | "ubereats" | "deliveroo";

type Review = {

  id: string;

  authorName: string;

  initials: string;

  avatarColor: string;

  rating: number;

  comment: string;

  date: string;

  answered: boolean;

  reply?: string;

  establishmentId: string;

  platform: Platform;

  dateTs?: number;

};



type Establishment = {

  id: string;

  name: string;

  color: string;

  avgRating: number;

  total: number;

  pending: number;

};



type Tone = "professionnel" | "empathique" | "concis";



const ESTABLISHMENTS: Establishment[] = [

  { id: "1", name: "Paris 8ème",     color: "#4f7cff", avgRating: 4.6, total: 248, pending: 2 },

  { id: "2", name: "Lyon Centre",    color: "#22c55e", avgRating: 4.8, total: 182, pending: 1 },

  { id: "3", name: "Bordeaux",       color: "#f59e0b", avgRating: 4.3, total: 134, pending: 0 },

  { id: "4", name: "Nice Promenade", color: "#ec4899", avgRating: 4.7, total: 97,  pending: 0 },

];



const MOCK_REVIEWS: Review[] = [

  { id: "r1", authorName: "Marc Alain",     initials: "MA", avatarColor: "#ef4444", rating: 1, answered: false, establishmentId: "1", date: "Il y a 4 min",  platform: "google",    dateTs: Date.now() - 4*60*1000,         comment: "Service absolument déplorable. J'ai attendu 45 minutes pour être servi et personne ne s'est excusé. La qualité ne correspond pas au prix pratiqué. Je ne reviendrai jamais." },

  { id: "r2", authorName: "Sophie Bernard", initials: "SB", avatarColor: "#22c55e", rating: 5, answered: false, establishmentId: "1", date: "Hier",           platform: "google",    dateTs: Date.now() - 1*86400000,        comment: "Expérience parfaite de bout en bout. L'équipe est aux petits soins, l'ambiance est chaleureuse. Je recommande vivement !" },

  { id: "r3", authorName: "Thomas Dupont",  initials: "TD", avatarColor: "#4f7cff", rating: 4, answered: true,  establishmentId: "1", date: "Il y a 2 jours", platform: "ubereats",  dateTs: Date.now() - 2*86400000,        comment: "Très bon dans l'ensemble. Quelques détails à améliorer sur les temps d'attente mais l'accueil est excellent." },

  { id: "r4", authorName: "Julie Martin",   initials: "JM", avatarColor: "#a855f7", rating: 3, answered: false, establishmentId: "2", date: "Il y a 3 jours", platform: "deliveroo", dateTs: Date.now() - 3*86400000,        comment: "Correct sans plus. Le personnel est sympa mais l'attente était un peu longue pour un mercredi midi." },

  { id: "r5", authorName: "Pierre Leclerc", initials: "PL", avatarColor: "#06b6d4", rating: 5, answered: true,  establishmentId: "2", date: "Il y a 4 jours", platform: "google",    dateTs: Date.now() - 4*86400000,        comment: "Excellent comme toujours ! La meilleure adresse de Lyon sans hésitation." },

  { id: "r6", authorName: "Camille Roux",   initials: "CR", avatarColor: "#f97316", rating: 2, answered: false, establishmentId: "3", date: "Il y a 5 jours", platform: "ubereats",  dateTs: Date.now() - 5*86400000,        comment: "Déçue par cette visite. L'accueil était froid et les produits n'étaient pas frais." },

  { id: "r7", authorName: "Antoine Morel",  initials: "AM", avatarColor: "#8b5cf6", rating: 4, answered: false, establishmentId: "1", date: "Il y a 6 jours", platform: "deliveroo", dateTs: Date.now() - 6*86400000,        comment: "Livraison rapide et plats bien emballés. La qualité était au rendez-vous, je recommande !" },

  { id: "r8", authorName: "Lucie Fontaine", initials: "LF", avatarColor: "#ec4899", rating: 2, answered: false, establishmentId: "2", date: "Il y a 1 sem.",  platform: "ubereats",  dateTs: Date.now() - 8*86400000,        comment: "Commande incomplète, un article manquait. Le service client n'a pas répondu rapidement." },

  { id: "r9", authorName: "Hugo Garnier",   initials: "HG", avatarColor: "#14b8a6", rating: 5, answered: false, establishmentId: "3", date: "Il y a 1 sem.",  platform: "deliveroo", dateTs: Date.now() - 8*86400000,        comment: "Parfait comme d'habitude. Les portions sont généreuses et tout était chaud à la livraison." },

  { id: "r10", authorName: "Clara Petit",   initials: "CP", avatarColor: "#f59e0b", rating: 1, answered: false, establishmentId: "1", date: "Il y a 35 jours", platform: "google",   dateTs: Date.now() - 35*86400000,       comment: "Très mauvaise expérience. Le personnel était irrespectueux et la nourriture froide." },

  { id: "r11", authorName: "Romain Blanc",  initials: "RB", avatarColor: "#6366f1", rating: 5, answered: true,  establishmentId: "2", date: "Il y a 50 jours", platform: "ubereats", dateTs: Date.now() - 50*86400000,       comment: "Toujours aussi bon ! La livraison est rapide et les plats sont délicieux." },

  { id: "r12", authorName: "Nadia Okafor",  initials: "NO", avatarColor: "#10b981", rating: 3, answered: false, establishmentId: "3", date: "Il y a 95 jours", platform: "deliveroo",dateTs: Date.now() - 95*86400000,       comment: "Correct sans plus. Rien d'exceptionnel mais rien à redire non plus." },

];



const PLATFORM_META: Record<Platform, { label: string; color: string; bg: string; icon: string }> = {
  google:    { label: "Google",    color: "#4285F4", bg: "rgba(66,133,244,0.12)",  icon: "G" },
  ubereats:  { label: "Uber Eats", color: "#06c167", bg: "rgba(6,193,103,0.12)",   icon: "U" },
  deliveroo: { label: "Deliveroo", color: "#00ccbc", bg: "rgba(0,204,188,0.12)",   icon: "D" },
};

function PlatformBadge({ platform }: { platform: Platform }) {
  const m = PLATFORM_META[platform];
  return (
    <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 8, fontWeight: 600, background: m.bg, color: m.color, letterSpacing: 0.2 }}>
      {m.label}
    </span>
  );
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {

  return (

    <span style={{ fontSize: size, color: "#fbbf24", letterSpacing: 1 }}>

      {"★".repeat(rating)}{"☆".repeat(5 - rating)}

    </span>

  );

}



export default function ReviewsHub() {

  const [establishments, setEstablishments] = useState<Establishment[]>(ESTABLISHMENTS);

  const [selectedEtab, setSelectedEtab]     = useState("1");

  const [reviews, setReviews]               = useState<Review[]>(MOCK_REVIEWS);

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const [filter, setFilter]                 = useState<"all" | "pending" | "negative">("all");

  const [starFilter, setStarFilter]         = useState<"all" | 1 | 2 | 3 | 4 | 5>("all");

  const [tone, setTone]                     = useState<Tone>("professionnel");

  const [aiReply, setAiReply]               = useState("");

  const [generating, setGenerating]         = useState(false);


  const [toneExamples, setToneExamples]     = useState<Record<string, string>>({});

  const [showApiModal, setShowApiModal]     = useState(false);

  const [toast, setToast]                   = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);

  const [published, setPublished]           = useState(false);

  const [activeNav, setActiveNav]           = useState("dashboard");

  const [sidebarOpen, setSidebarOpen]       = useState(false);

  const [showPanel, setShowPanel]           = useState(false);

  const [showAlerts, setShowAlerts]         = useState(false);

  const [seenAlerts, setSeenAlerts]         = useState<Set<string>>(new Set());

  const [dashboardEtab, setDashboardEtab]   = useState<"all" | string>("all");

  const [alertsEtab, setAlertsEtab]         = useState<"all" | string>("all");

  const [platformFilter, setPlatformFilter] = useState<"all" | Platform>("all");

  const [dashPlatform, setDashPlatform]     = useState<"all" | Platform>("all");

  const [alertsPlatform, setAlertsPlatform] = useState<"all" | Platform>("all");

  const [timeframe, setTimeframe]           = useState<"7d" | "30d" | "90d" | "all">("all");

  const [googleToken, setGoogleToken]       = useState("");

  const [googleConnected, setGoogleConnected] = useState(false);

  const [gmbAccountId, setGmbAccountId]     = useState(() => typeof window !== "undefined" ? localStorage.getItem("gmb_account_id") || "" : "");

  const [gmbLocationId, setGmbLocationId]   = useState(() => typeof window !== "undefined" ? localStorage.getItem("gmb_location_id") || "" : "");



  useEffect(() => {
    // Charge les exemples depuis le serveur
    fetch("/api/config").then((r) => r.json()).then((data) => {
      setToneExamples({
        gabin: data.toneExamplesGabin || "",
        cotesushi: data.toneExamplesCoteSushi || "",
      });
    });

    // Rafraîchit le token Google toutes les 55 minutes proactivement
    const refreshInterval = setInterval(async () => {
      const saved = localStorage.getItem("google_access_token");
      if (!saved) return;
      const res = await fetch("/api/auth/google/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem("google_access_token", data.access_token);
          setGoogleToken(data.access_token);
        }
      }
    }, 55 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    (async () => {

    // Récupère le token Google depuis l'URL après OAuth

    const params = new URLSearchParams(window.location.search);

    const token = params.get("google_token");

    if (token) {

      localStorage.setItem("google_access_token", token);

      setGoogleToken(token);

      setGoogleConnected(true);

      window.history.replaceState({}, "", "/");

      showToast("Google Business connecté ✓", "success");

      // Charge les vrais avis

      loadGoogleReviews(token);

    } else {

      // Tente un refresh automatique (fonctionne pour tous les navigateurs)
      const res = await fetch("/api/auth/google/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem("google_access_token", data.access_token);
          setGoogleToken(data.access_token);
          setGoogleConnected(true);
          loadGoogleReviews(data.access_token);
        }
      }

    }

    })();
  }, []);



 const refreshGoogleToken = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/google/refresh", { method: "POST" });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("google_access_token", data.access_token);
        setGoogleToken(data.access_token);
        return data.access_token;
      }
    } catch {}
    return null;
  };

 const loadGoogleReviews = async (token: string) => {

  try {

    // 1. Récupère les comptes

    const accountsRes = await fetch("/api/reviews/gmb", {

      headers: { "x-google-token": token },

    });

    const accountsData = await accountsRes.json();

    // Si token expiré, tente un refresh silencieux
    if (accountsData.error?.code === 401 || accountsData.error?.status === "UNAUTHENTICATED") {
      const newToken = await refreshGoogleToken();
      if (newToken) {
        loadGoogleReviews(newToken);
        return;
      }
      setGoogleConnected(false);
      showToast("Session Google expirée — reconnectez-vous", "error");
      return;
    }

    if (!accountsData.accounts?.length) {
      const isQuota = accountsData.error?.status === "RESOURCE_EXHAUSTED" || accountsData.error?.message?.includes("Quota");
      if (isQuota) {
        showToast("Quota Google dépassé — réessai automatique dans 60s…", "info");
        setTimeout(() => loadGoogleReviews(token), 60000);
      } else {
        showToast("Google API : " + (accountsData.error?.message || JSON.stringify(accountsData)), "error");
      }
      return;
    }

    const accountId = accountsData.accounts[0].name.split("/")[1];



    // 2. Récupère les vrais établissements (Gabin, Côté Sushi...)

    const locsRes = await fetch(`/api/reviews/gmb?accountId=${accountId}`, {

      headers: { "x-google-token": token },

    });

    const locsData = await locsRes.json();



    if (locsData.locations?.length) {

      // On transforme les données Google pour ton interface

      const realEtabs: Establishment[] = locsData.locations.filter((loc: any) => loc.title !== "Gambino").map((loc: any, index: number) => ({

        id: loc.name.split("/")[1], // On récupère l'ID réel

        name: loc.title,           // <--- ICI : Gabin ou Côté Sushi

        color: ["#4f7cff", "#22c55e", "#f59e0b", "#ec4899"][index % 4],

        avgRating: loc.metadata?.mapsUri ? 4.5 : 0, // Note temporaire si non fournie

        total: 0,

        pending: 0

      }));

      

      setEstablishments(realEtabs);

      setSelectedEtab(realEtabs[0].id);

      setGmbAccountId(accountId);

      setGmbLocationId(realEtabs[0].id);

      // Cache IDs so subsequent page loads skip the Account Management API call
      localStorage.setItem("gmb_account_id",  accountId);
      localStorage.setItem("gmb_location_id", realEtabs[0].id);

      // Charge les avis de tous les établissements
      const allReviews: Review[] = [];
      for (const etab of realEtabs) {
        const reviewsRes = await fetch(`/api/reviews/gmb?accountId=${accountId}&locationId=${etab.id}`, {
          headers: { "x-google-token": token },
        });
        const reviewsData = await reviewsRes.json();
        if (reviewsData.reviews?.length) {
          const mapped: Review[] = reviewsData.reviews.map((rev: any) => ({
            id: rev.name,
            authorName: rev.reviewer?.displayName || "Anonyme",
            initials: (rev.reviewer?.displayName || "A").substring(0, 2).toUpperCase(),
            avatarColor: ["#ef4444", "#22c55e", "#4f7cff", "#a855f7", "#06b6d4", "#f97316"][Math.floor(Math.random() * 6)],
            rating: { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }[rev.starRating as string] || 3,
            comment: (rev.comment || "").trim(),
            date: rev.createTime ? new Date(rev.createTime).toLocaleDateString("fr-FR") : "Date inconnue",
            answered: !!rev.reviewReply,
            reply: rev.reviewReply?.comment || "",
            establishmentId: etab.id,
            platform: "google" as Platform,
            dateTs: rev.createTime ? new Date(rev.createTime).getTime() : undefined,
          }));
          allReviews.push(...mapped);
        }
      }
      setReviews(allReviews);

    }

  } catch (e) {

    console.error("Erreur sync Google:", e);

  }

};

  const loadReviewsOnly = async (token: string, accountId: string, locationId: string) => {
    try {
      const reviewsRes = await fetch(`/api/reviews/gmb?accountId=${accountId}&locationId=${locationId}`, {
        headers: { "x-google-token": token },
      });
      const reviewsData = await reviewsRes.json();
      if (reviewsData.reviews?.length) {
        const googleReviews: Review[] = reviewsData.reviews.map((rev: any) => ({
          id: rev.name,
          authorName: rev.reviewer?.displayName || "Anonyme",
          initials: (rev.reviewer?.displayName || "A").substring(0, 2).toUpperCase(),
          avatarColor: ["#ef4444", "#22c55e", "#4f7cff", "#a855f7", "#06b6d4", "#f97316"][Math.floor(Math.random() * 6)],
          rating: { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }[rev.starRating as string] || 3,
          comment: (rev.reviewText || "").trim(),
          date: rev.createTime ? new Date(rev.createTime).toLocaleDateString("fr-FR") : "Date inconnue",
          answered: !!rev.reviewReply,
          reply: rev.reviewReply?.comment || "",
          establishmentId: locationId,
          platform: "google" as Platform,
          dateTs: rev.createTime ? new Date(rev.createTime).getTime() : undefined,
        }));
        setReviews(googleReviews);
        setEstablishments((prev) => prev.length ? prev : [{ id: locationId, name: "Mon établissement", color: "#4f7cff", avgRating: 0, total: googleReviews.length, pending: googleReviews.filter((r) => !r.answered).length }]);
        setSelectedEtab(locationId);
        setGmbAccountId(accountId);
        setGmbLocationId(locationId);
      } else if (reviewsData.error) {
        showToast("Google API : " + (reviewsData.error?.message || JSON.stringify(reviewsData.error)), "error");
      }
    } catch (e) {
      console.error("Erreur chargement avis:", e);
    }
  };

 const etab = establishments.find((e) => e.id === selectedEtab) || establishments[0];

  const etabReviews = reviews.filter((r) => r.establishmentId === selectedEtab);

  const filteredReviews = etabReviews.filter((r) => {

    if (platformFilter !== "all" && r.platform !== platformFilter) return false;

    if (starFilter !== "all" && r.rating !== starFilter) return false;

    if (filter === "pending")  return !r.answered;

    if (filter === "negative") return r.rating <= 2;

    return true;

  });

  const pendingCount = reviews.filter((r) => !r.answered).length;

  const negativeReviews = reviews.filter((r) => r.rating <= 2 && !r.answered);



  const showToast = (msg: string, type: "error" | "success" | "info" = "info") => {

    setToast({ msg, type });

    setTimeout(() => setToast(null), 4000);

  };



  const generateReply = async (review: Review) => {


    setSelectedReview(review);

    setAiReply("");

    setPublished(false);

    setGenerating(true);

    setShowPanel(true);



    const toneMap: Record<Tone, string> = {

      professionnel: "Réponds de manière professionnelle et courtoise.",

      empathique:    "Réponds avec beaucoup d'empathie et de chaleur humaine.",

      concis:        "Réponds de manière courte et directe, 2-3 phrases maximum.",

    };



    const googleReplies = reviews
      .filter((r) => r.answered && r.reply && r.establishmentId === review.establishmentId)
      .slice(0, 3)
      .map((r) => `Avis: "${r.comment}" → Réponse: "${r.reply}"`)
      .join("\n");

    const etabKey = etab.name.toLowerCase().includes("sushi") ? "cotesushi" : "gabin";
    const exampleText = googleReplies || (toneExamples[etabKey] || "").trim();

    const styleContext = exampleText
      ? `\n\nVoici des exemples de réponses déjà publiées, adopte exactement le même style, ton et vocabulaire :\n${exampleText}`
      : "";

    const platformLabel = PLATFORM_META[review.platform].label;
    const prompt = `Tu gères les avis ${platformLabel} de "${etab.name}". Client: ${review.authorName}, note: ${review.rating}/5. Avis: "${review.comment}". ${toneMap[tone]} Réponds en français, 80 mots max. Uniquement le texte de la réponse.${styleContext}`;



    try {

      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur API");
      }

      const data = await res.json();
      const text = data.text || "";

      setAiReply(text);

    } catch (e: unknown) {

      const msg = e instanceof Error ? e.message : "Erreur API";

      showToast("Erreur : " + msg, "error");

      setAiReply("");

    } finally {

      setGenerating(false);

    }

  };



  const publishReply = async () => {

    if (!selectedReview || !aiReply) return;

    if (googleConnected && gmbAccountId && gmbLocationId) {

      try {

        const reviewId = selectedReview.id.split("/").pop();

        const res = await fetch("/api/reviews/gmb", {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

            "x-google-token": googleToken,

          },

          body: JSON.stringify({

            accountId: gmbAccountId,

            locationId: gmbLocationId,

            reviewId,

            reply: aiReply,

          }),

        });

        if (!res.ok) {

          showToast("Erreur lors de la publication", "error");

          return;

        }

      } catch {

        showToast("Erreur lors de la publication", "error");

        return;

      }

    }

    setReviews((prev) =>

      prev.map((r) => (r.id === selectedReview.id ? { ...r, answered: true, reply: aiReply } : r))

    );

    setPublished(true);

    showToast(`Réponse publiée sur ${PLATFORM_META[selectedReview.platform].label} ✓`, "success");

  };




  const timeframeCutoff = timeframe === "7d" ? Date.now() - 7*86400000 : timeframe === "30d" ? Date.now() - 30*86400000 : timeframe === "90d" ? Date.now() - 90*86400000 : 0;

  const dashReviews = reviews.filter((r: Review) => {
    if (dashboardEtab !== "all" && r.establishmentId !== dashboardEtab) return false;
    if (dashPlatform !== "all" && r.platform !== dashPlatform) return false;
    if (timeframe !== "all" && r.dateTs !== undefined && r.dateTs < timeframeCutoff) return false;
    return true;
  });

  const dashAvgRating = dashboardEtab === "all"
    ? (establishments.reduce((s: number, e: Establishment) => s + e.avgRating, 0) / Math.max(establishments.length, 1)).toFixed(1)
    : (establishments.find((e: Establishment) => e.id === dashboardEtab)?.avgRating ?? 0);

  const dashTotal = dashboardEtab === "all"
    ? establishments.reduce((s: number, e: Establishment) => s + e.total, 0)
    : (dashReviews.length || establishments.find((e: Establishment) => e.id === dashboardEtab)?.total || 0);

  const dashRatingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: dashReviews.filter((r: Review) => r.rating === star).length,
    pct: dashReviews.length
      ? Math.round((dashReviews.filter((r: Review) => r.rating === star).length / dashReviews.length) * 100)
      : 0,
  }));



  const navItems = [

    { id: "dashboard", icon: "◼", label: "Dashboard" },

    { id: "reviews",   icon: "💬", label: "Avis",       badge: pendingCount || undefined },

    { id: "alerts",    icon: "🔔", label: "Alertes",    badge: 1 },

    { id: "settings",  icon: "⚙️",  label: "Paramètres" },

  ];



  return (

    <div suppressHydrationWarning style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <style>{`

        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { overflow: auto; background: #0f0f12; }

        ::-webkit-scrollbar { width: 4px; }

        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .nav-item { display:flex;align-items:center;gap:10px;padding:8px 10px;margin:1px 8px;border-radius:8px;font-size:13.5px;cursor:pointer;color:#7c7b89;transition:all .15s; }

        .nav-item:hover { background:#21212b;color:#eeedf4; }

        .nav-item.active { background:rgba(79,124,255,0.12);color:#4f7cff; }

        .etab-item { display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;transition:all .15s; }

        .etab-item:hover { background:#21212b; }

        .etab-item.active { background:#21212b; }

        .btn { padding:8px 16px;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;border:none;font-weight:500;transition:all .15s; }

        .btn-primary { background:#4f7cff;color:#fff; }

        .btn-primary:hover { background:#3d6bff; }

        .btn-primary:disabled { background:#2a2a36;color:#5a5968;cursor:not-allowed; }

        .btn-ghost { background:transparent;color:#7c7b89;border:1px solid rgba(255,255,255,0.13); }

        .btn-ghost:hover { background:#21212b;color:#eeedf4; }

        .pill { padding:5px 12px;border-radius:20px;font-size:12px;cursor:pointer;border:1px solid rgba(255,255,255,0.07);color:#7c7b89;transition:all .15s; }

        .pill.active { background:rgba(79,124,255,0.15);border-color:#4f7cff;color:#4f7cff; }

        .review-item { padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.07);transition:background .15s;cursor:pointer; }

        .review-item:hover { background:#21212b; }

        .review-item.selected { background:rgba(79,124,255,0.06);border-left:2px solid #4f7cff; }

        .tone-btn { padding:5px 12px;border-radius:8px;font-size:12px;cursor:pointer;border:1px solid rgba(255,255,255,0.07);color:#7c7b89;background:transparent;transition:all .15s;font-family:'DM Sans',sans-serif; }

        .tone-btn.active { background:rgba(124,92,252,0.15);border-color:#7c5cfc;color:#a78bfa; }

        .input-field { width:100%;background:#21212b;border:1px solid rgba(255,255,255,0.13);border-radius:8px;padding:10px 14px;color:#eeedf4;font-family:'DM Sans',sans-serif;font-size:13px;outline:none; }

        .input-field:focus { border-color:#4f7cff; }

        @keyframes blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }

        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        @keyframes toastIn { from{transform:translateX(120%);opacity:0} to{transform:translateX(0);opacity:1} }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }

        @keyframes slideIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }

        .ai-cursor { display:inline-block;width:2px;height:14px;background:#7c5cfc;animation:blink .8s steps(1) infinite;vertical-align:middle;margin-left:2px; }

        .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:100;animation:fadeIn .2s ease; }

        .modal { background:#18181f;border:1px solid rgba(255,255,255,0.13);border-radius:16px;padding:28px;width:400px;max-width:90vw; }

        .toast-wrap { position:fixed;top:20px;right:20px;z-index:200;animation:toastIn .3s ease;background:#18181f;border-radius:12px;padding:14px 18px;max-width:300px;display:flex;gap:12px;align-items:center;box-shadow:0 8px 32px rgba(0,0,0,.5); }

        .sidebar-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:40; }

        .sidebar { width:230px;min-width:230px;background:#18181f;border-right:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;overflow:hidden;position:sticky;top:0;height:100vh;z-index:50; }

        .mobile-panel { display:none; }

        @media (max-width: 768px) {

          .sidebar { position:fixed;top:0;left:0;bottom:0;transform:translateX(-100%);transition:transform .25s ease; }

          .sidebar.open { transform:translateX(0); }

          .desktop-panel { display:none !important; }

          .mobile-back { display:flex !important; }

          .stats-grid-responsive { grid-template-columns: repeat(2,1fr) !important; }

          .topbar-responsive { padding: 10px 16px !important; }

          .content-responsive { padding: 16px !important; }

          .mobile-panel { position:fixed;inset:0;background:#18181f;z-index:50;display:flex;flex-direction:column;animation:fadeIn .2s ease;overflow-y:auto; }

        }

        @media (min-width: 769px) {

          .mobile-menu-btn { display:none !important; }

          .mobile-back { display:none !important; }

        }

      `}</style>



      {showAlerts && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowAlerts(false)} />
      )}

      {toast && (

        <div className="toast-wrap" style={{ border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,.3)" : toast.type === "success" ? "rgba(34,197,94,.3)" : "rgba(255,255,255,.13)"}` }}>

          <span style={{ fontSize: 18 }}>{toast.type === "error" ? "❌" : toast.type === "success" ? "✅" : "ℹ️"}</span>

          <span style={{ fontSize: 13, color: "#eeedf4" }}>{toast.msg}</span>

        </div>

      )}



      {showApiModal && (

        <div className="modal-overlay" onClick={() => setShowApiModal(false)}>

          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#eeedf4" }}>Clé API Gemini</div>

            <div style={{ fontSize: 13, color: "#7c7b89", marginBottom: 20, lineHeight: 1.6 }}>

              Entre ta clé API Gemini depuis{" "}

              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: "#4f7cff" }}>aistudio.google.com</a>

            </div>

            <div style={{ fontSize: 12, color: "#7c7b89", padding: "10px 14px", background: "rgba(79,124,255,0.08)", borderRadius: 8, marginBottom: 20 }}>
              La clé API est configurée sur le serveur.
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: "#eeedf4", marginBottom: 6 }}>Exemples de réponses publiées</div>

            <div style={{ fontSize: 12, color: "#7c7b89", marginBottom: 10, lineHeight: 1.5 }}>
              Colle ici 2-3 réponses que tu as déjà publiées sur Google. L'IA imitera ton style et ton vocabulaire.
            </div>

            <div style={{ fontSize: 12, color: "#7c7b89", padding: "10px 14px", background: "rgba(79,124,255,0.08)", borderRadius: 8, marginBottom: 16 }}>
              Les exemples de ton sont configurés par restaurant sur le serveur.
            </div>

            <div style={{ display: "flex", gap: 8 }}>

              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                setShowApiModal(false);
              }}>Fermer</button>

              <button className="btn btn-ghost" onClick={() => setShowApiModal(false)}>Annuler</button>

            </div>

          </div>

        </div>

      )}



      {showPanel && selectedReview && (

        <div className="mobile-panel">

          <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12 }}>

            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => setShowPanel(false)}>← Retour</button>

            <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Réponse IA</div>

          </div>

          <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>

            <div style={{ background: "#21212b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14 }}>

              <Stars rating={selectedReview.rating} size={14} />

              {selectedReview.comment && <div style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(238,237,244,0.85)", marginTop: 6 }}>&ldquo;{selectedReview.comment}&rdquo;</div>}

              <div style={{ fontSize: 12, color: "#7c7b89", marginTop: 8 }}>— {selectedReview.authorName}</div>

            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>

              {(["professionnel", "empathique", "concis"] as Tone[]).map((t) => (

                <button key={t} className={`tone-btn${tone === t ? " active" : ""}`} onClick={() => setTone(t)}>

                  {t.charAt(0).toUpperCase() + t.slice(1)}

                </button>

              ))}

            </div>

            {!aiReply && !generating && (
              <div style={{ background: "#21212b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14, fontSize: 13, minHeight: 120, color: "#5a5968", fontStyle: "italic" }}>
                Cliquez sur &ldquo;Générer&rdquo;…
              </div>
            )}
            {generating && !aiReply && (
              <div style={{ background: "#21212b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14, fontSize: 13, minHeight: 120, color: "#7c7b89", fontStyle: "italic" }}>
                Génération en cours<span className="ai-cursor" />
              </div>
            )}
            {aiReply && (
              <textarea
                className="input-field"
                rows={14}
                value={aiReply + (generating ? " ▍" : "")}
                onChange={(e) => setAiReply(e.target.value)}
                readOnly={generating}
                style={{ resize: "vertical", lineHeight: 1.65, minHeight: 120 }}
              />
            )}

            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => generateReply(selectedReview)} disabled={generating}>

              {generating ? "Génération…" : "✨ Générer avec Gemini"}

            </button>

            {aiReply && !generating && !published && (
              <>
                {selectedReview.platform === "google" && (
                  <button className="btn btn-primary" style={{ width: "100%", background: PLATFORM_META["google"].color }} onClick={publishReply}>
                    Publier sur Google
                  </button>
                )}
                <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => {
                  navigator.clipboard.writeText(aiReply);
                  showToast("Réponse copiée ✓", "success");
                }}>
                  📋 Copier
                </button>
              </>
            )}

            {published && <div style={{ textAlign: "center", fontSize: 13, color: "#22c55e", padding: "10px 0" }}>✓ Réponse publiée</div>}

          </div>

        </div>

      )}



      <div style={{ display: "flex", minHeight: "100vh", background: "#0f0f12", color: "#eeedf4" }}>



        {sidebarOpen && (

          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />

        )}



        <div className={`sidebar${sidebarOpen ? " open" : ""}`}>

          <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10 }}>

            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#4f7cff,#7c5cfc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⭐</div>

            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 600, flex: 1 }}>ReviewsHub</span>

            <button className="mobile-menu-btn btn btn-ghost" style={{ padding: "4px 8px", fontSize: 16 }} onClick={() => setSidebarOpen(false)}>✕</button>

          </div>



          <div style={{ padding: "10px 0 4px" }}>

            <div style={{ padding: "4px 16px 6px", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#5a5968", fontWeight: 500 }}>Navigation</div>

            {navItems.map((item) => (

              <div key={item.id} className={`nav-item${activeNav === item.id ? " active" : ""}`} onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}>

                <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{item.icon}</span>

                <span style={{ flex: 1 }}>{item.label}</span>

                {item.badge ? <span style={{ background: "#ef4444", color: "#fff", fontSize: 10, padding: "1px 6px", borderRadius: 20, fontWeight: 600 }}>{item.badge}</span> : null}

              </div>

            ))}

          </div>



          <div style={{ flex: 1 }} />



          <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 8 }}>

            <button className="btn btn-ghost" style={{ width: "100%", fontSize: 12, color: googleConnected ? "#22c55e" : "#7c7b89" }}

              onClick={() => { window.location.href = "/api/auth/google"; }}>

              {googleConnected ? "✓ Google Business connecté" : "🔗 Connecter Google Business"}

            </button>


            <button className="btn btn-ghost" style={{ width: "100%", fontSize: 12, color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}>
              Déconnexion
            </button>

          </div>

        </div>



        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          <div className="topbar-responsive" style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#18181f", display: "flex", alignItems: "center", gap: 12 }}>

            <button className="mobile-menu-btn btn btn-ghost" style={{ padding: "6px 10px", fontSize: 18 }} onClick={() => setSidebarOpen(true)}>☰</button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 500 }}>
                {activeNav === "dashboard" ? "Dashboard" : activeNav === "reviews" ? "Avis" : activeNav === "alerts" ? "Alertes" : activeNav === "settings" ? "Paramètres" : ""}
              </span>
              {(activeNav === "dashboard" || activeNav === "reviews" || activeNav === "alerts") && (
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 500, color: "#7c7b89" }}>
                  {" · "}
                  <span style={{ color: activeNav === "dashboard" ? (dashboardEtab === "all" ? "#eeedf4" : (establishments.find((e: Establishment) => e.id === dashboardEtab)?.color || "#eeedf4")) : activeNav === "reviews" ? etab.color : (alertsEtab === "all" ? "#eeedf4" : (establishments.find((e: Establishment) => e.id === alertsEtab)?.color || "#eeedf4")) }}>
                    {activeNav === "dashboard" ? (dashboardEtab === "all" ? "Tous les restaurants" : establishments.find((e: Establishment) => e.id === dashboardEtab)?.name) : activeNav === "reviews" ? etab.name : (alertsEtab === "all" ? "Tous les restaurants" : establishments.find((e: Establishment) => e.id === alertsEtab)?.name)}
                  </span>
                </span>
              )}
            </div>

            <div style={{ position: "relative" }}>

              <button className="btn btn-ghost" style={{ fontSize: 13, padding: "6px 12px", position: "relative" }}

                onClick={() => { setShowAlerts((v) => !v); setSeenAlerts(new Set(negativeReviews.map((r) => r.id))); }}>

                🔔

                {negativeReviews.filter((r) => !seenAlerts.has(r.id)).length > 0 && (

                  <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", display: "block" }} />

                )}

              </button>

              {showAlerts && (

                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 300, background: "#18181f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100, overflow: "hidden" }}>

                  <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: 13, fontWeight: 600 }}>Avis négatifs récents</div>

                  {negativeReviews.length === 0 ? (

                    <div style={{ padding: 20, fontSize: 13, color: "#7c7b89", textAlign: "center" }}>Aucun avis négatif</div>

                  ) : negativeReviews.slice(0, 5).map((r) => (

                    <div key={r.id} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}

                      onClick={() => { setSelectedReview(r); setShowAlerts(false); setAiReply(""); setPublished(false); }}>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>

                        <span style={{ fontSize: 11, color: "#ef4444" }}>{"★".repeat(r.rating)}</span>

                        <span style={{ fontSize: 12, fontWeight: 500 }}>{r.authorName}</span>

                        {!seenAlerts.has(r.id) && <span style={{ width: 6, height: 6, background: "#ef4444", borderRadius: "50%", display: "inline-block", marginLeft: "auto" }} />}

                      </div>

                      {r.comment && <div style={{ fontSize: 12, color: "#7c7b89", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.comment}</div>}

                    </div>

                  ))}

                </div>

              )}

            </div>

          </div>



          <div className="content-responsive" style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

            {activeNav === "alerts" && (
              <div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <div className={`pill${alertsEtab === "all" ? " active" : ""}`} onClick={() => setAlertsEtab("all")}>Tous</div>
                  {establishments.map((e: Establishment) => (
                    <div key={e.id} className={`pill${alertsEtab === e.id ? " active" : ""}`} onClick={() => setAlertsEtab(e.id)}>
                      <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: e.color, marginRight: 5 }} />
                      {e.name}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  <div className={`pill${alertsPlatform === "all" ? " active" : ""}`} onClick={() => setAlertsPlatform("all")}>Toutes les plateformes</div>
                  {(Object.keys(PLATFORM_META) as Platform[]).map((p) => (
                    <div key={p} className={`pill${alertsPlatform === p ? " active" : ""}`} onClick={() => setAlertsPlatform(p)}
                      style={alertsPlatform === p ? { borderColor: PLATFORM_META[p].color, color: PLATFORM_META[p].color, background: PLATFORM_META[p].bg } : {}}>
                      {PLATFORM_META[p].label}
                    </div>
                  ))}
                </div>
                {(() => {
                  const alertsFiltered = negativeReviews.filter((r: Review) => {
                    if (alertsEtab !== "all" && r.establishmentId !== alertsEtab) return false;
                    if (alertsPlatform !== "all" && r.platform !== alertsPlatform) return false;
                    return true;
                  });
                  return alertsFiltered.length === 0 ? (
                    <div style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 32, textAlign: "center", color: "#5a5968", fontSize: 14 }}>Aucun avis négatif en attente</div>
                  ) : alertsFiltered.map((r) => (
                    <div key={r.id} className="review-item" style={{ marginBottom: 8 }} onClick={() => { setSelectedReview(r); setAiReply(""); setPublished(false); setActiveNav("reviews"); }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: r.avatarColor + "22", color: r.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{r.initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{r.authorName}</div>
                          <div style={{ fontSize: 12, color: "#7c7b89", display: "flex", gap: 8, alignItems: "center" }}>
                            <span>{r.date}</span>
                            <span style={{ color: "#ef4444" }}>{"★".repeat(r.rating)}</span>
                            <PlatformBadge platform={r.platform} />
                          </div>
                        </div>
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, fontWeight: 500, background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>Urgent</span>
                      </div>
                      {r.comment && <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(238,237,244,0.75)" }}>&ldquo;{r.comment}&rdquo;</div>}
                    </div>
                  ));
                })()}
              </div>
            )}

            {activeNav === "settings" && (
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Paramètres</div>
                <div style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 24, maxWidth: 540, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#eeedf4", marginBottom: 6 }}>Clé API Gemini</div>
                    <div style={{ fontSize: 12, color: "#7c7b89", padding: "10px 14px", background: "rgba(79,124,255,0.08)", borderRadius: 8 }}>
                      La clé API est configurée sur le serveur.
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#eeedf4", marginBottom: 6 }}>Exemples de réponses publiées</div>
                    <div style={{ fontSize: 12, color: "#7c7b89", marginBottom: 10, lineHeight: 1.5 }}>Colle ici 2-3 réponses que tu as déjà publiées sur Google. L'IA imitera ton style et ton vocabulaire.</div>
                    <div style={{ fontSize: 12, color: "#7c7b89", padding: "10px 14px", background: "rgba(79,124,255,0.08)", borderRadius: 8 }}>
                      Les exemples de ton sont configurés par restaurant sur le serveur.
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => {
                      showToast("Les paramètres sont configurés sur le serveur", "info");
                  }}>OK</button>
                </div>
              </div>
            )}

            {activeNav === "dashboard" && <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <div className={`pill${dashboardEtab === "all" ? " active" : ""}`} onClick={() => setDashboardEtab("all")}>Tous</div>
              {establishments.map((e: Establishment) => (
                <div key={e.id} className={`pill${dashboardEtab === e.id ? " active" : ""}`} onClick={() => setDashboardEtab(e.id)}>
                  <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: e.color, marginRight: 5 }} />
                  {e.name}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              <div className={`pill${dashPlatform === "all" ? " active" : ""}`} onClick={() => setDashPlatform("all")}>Toutes les plateformes</div>
              {(Object.keys(PLATFORM_META) as Platform[]).map((p) => (
                <div key={p} className={`pill${dashPlatform === p ? " active" : ""}`} onClick={() => setDashPlatform(p)}
                  style={dashPlatform === p ? { borderColor: PLATFORM_META[p].color, color: PLATFORM_META[p].color, background: PLATFORM_META[p].bg } : {}}>
                  {PLATFORM_META[p].label}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              <div className={`pill${timeframe === "7d"  ? " active" : ""}`} onClick={() => setTimeframe("7d")}>7 jours</div>
              <div className={`pill${timeframe === "30d" ? " active" : ""}`} onClick={() => setTimeframe("30d")}>30 jours</div>
              <div className={`pill${timeframe === "90d" ? " active" : ""}`} onClick={() => setTimeframe("90d")}>90 jours</div>
              <div className={`pill${timeframe === "all" ? " active" : ""}`} onClick={() => setTimeframe("all")}>Tout</div>
            </div>

            <div className="stats-grid-responsive" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {[
                { label: "Note moy.", value: dashAvgRating, color: "#fbbf24", trend: "↑ +0.2", tc: "#22c55e" },
                { label: "Total avis", value: dashTotal, color: "#eeedf4", trend: "↑ +18", tc: "#22c55e" },
                { label: "Sans réponse", value: dashReviews.filter((r: Review) => !r.answered).length, color: "#ef4444", trend: "À traiter", tc: "#ef4444" },
                { label: "Taux réponse", value: `${Math.round(dashReviews.filter((r: Review) => r.answered).length / Math.max(dashReviews.length, 1) * 100)}%`, color: "#22c55e", trend: "↑ +3%", tc: "#22c55e" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, color: "#7c7b89", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 600, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, marginTop: 4, color: s.tc }}>{s.trend}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 42, fontWeight: 600, lineHeight: 1 }}>{dashAvgRating}</div>
                  <div style={{ fontSize: 18, color: "#fbbf24", letterSpacing: 2, margin: "6px 0 4px" }}>★★★★★</div>
                  <div style={{ fontSize: 13, color: "#7c7b89" }}>sur {dashTotal} avis</div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  {dashRatingDist.map(({ star, count, pct }) => (
                    <div key={star} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                      <span style={{ fontSize: 12, color: "#7c7b89", width: 8 }}>{star}</span>
                      <div style={{ flex: 1, height: 6, background: "#21212b", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 3, background: star >= 4 ? "#fbbf24" : star === 3 ? "#f59e0b" : "#ef4444", width: `${pct}%`, transition: "width .6s ease" }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#7c7b89", width: 24, textAlign: "right" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </>}

            {activeNav === "reviews" && <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              {establishments.map((e: Establishment) => (
                <div key={e.id} className={`pill${selectedEtab === e.id ? " active" : ""}`} onClick={() => { setSelectedEtab(e.id); setSelectedReview(null); setAiReply(""); }}>
                  <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: e.color, marginRight: 5 }} />
                  {e.name}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              <div className={`pill${platformFilter === "all" ? " active" : ""}`} onClick={() => setPlatformFilter("all")}>Toutes les plateformes</div>
              {(Object.keys(PLATFORM_META) as Platform[]).map((p) => (
                <div key={p} className={`pill${platformFilter === p ? " active" : ""}`} onClick={() => setPlatformFilter(p)}
                  style={platformFilter === p ? { borderColor: PLATFORM_META[p].color, color: PLATFORM_META[p].color, background: PLATFORM_META[p].bg } : {}}>
                  {PLATFORM_META[p].label}
                </div>
              ))}
            </div>
            <div style={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14 }}>

              <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

                <div style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>Avis récents</div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>

                  {(["all", "pending", "negative"] as const).map((f) => (

                    <div key={f} className={`pill${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>

                      {f === "all" ? "Tous" : f === "pending" ? "À répondre" : "Négatifs"}

                    </div>

                  ))}

                  <div style={{ width: 1, background: "rgba(255,255,255,0.1)", margin: "0 2px" }} />

                  <div className={`pill${starFilter === "all" ? " active" : ""}`} onClick={() => setStarFilter("all")} style={{ fontSize: 11 }}>★ Tous</div>

                  {([5, 4, 3, 2, 1] as const).map((s) => (
                    <div key={s} className={`pill${starFilter === s ? " active" : ""}`} onClick={() => setStarFilter(s)}
                      style={starFilter === s ? { borderColor: s >= 4 ? "#fbbf24" : s === 3 ? "#f59e0b" : "#ef4444", color: s >= 4 ? "#fbbf24" : s === 3 ? "#f59e0b" : "#ef4444", background: s >= 4 ? "rgba(251,191,36,0.12)" : s === 3 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)", fontSize: 11 } : { fontSize: 11 }}>
                      {"★".repeat(s)}
                    </div>
                  ))}

                </div>

              </div>

              <div>

                {filteredReviews.length === 0 && (

                  <div style={{ padding: 32, textAlign: "center", color: "#5a5968", fontSize: 14 }}>Aucun avis dans cette catégorie</div>

                )}

                {filteredReviews.map((review) => (

                  <div key={review.id} className={`review-item${selectedReview?.id === review.id ? " selected" : ""}`}

                    onClick={() => { setSelectedReview(review); setAiReply(""); setPublished(false); }}>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>

                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: review.avatarColor + "22", color: review.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>

                        {review.initials}

                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>

                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{review.authorName}</div>

                        <div style={{ fontSize: 12, color: "#7c7b89", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

                          <span>{review.date}</span>

                          <Stars rating={review.rating} size={12} />

                          <PlatformBadge platform={review.platform} />

                        </div>

                      </div>

                      <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, fontWeight: 500, flexShrink: 0, background: review.answered ? "rgba(34,197,94,0.12)" : review.rating <= 2 ? "rgba(239,68,68,0.12)" : "rgba(79,124,255,0.12)", color: review.answered ? "#22c55e" : review.rating <= 2 ? "#ef4444" : "#4f7cff" }}>

                        {review.answered ? "Répondu" : review.rating <= 2 ? "Urgent" : "À répondre"}

                      </span>

                    </div>

                    {review.comment && <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(238,237,244,0.75)", marginBottom: 12 }}>

                      &ldquo;{review.comment}&rdquo;

                    </div>}

                    <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }}

                      onClick={(e) => { e.stopPropagation(); generateReply(review); }}>

                      ✨ Générer réponse IA

                    </button>

                  </div>

                ))}

              </div>

            </div></>}

          </div>

        </div>



        <div className="desktop-panel" style={{ width: 368, minWidth: 368, background: "#18181f", borderLeft: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>

          <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>

            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>Réponse IA</div>

            <div style={{ fontSize: 12, color: "#7c7b89" }}>

              {selectedReview ? `${selectedReview.authorName} · ${"★".repeat(selectedReview.rating)}` : "Sélectionnez un avis"}

            </div>

          </div>



          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>

            {!selectedReview ? (

              <div style={{ textAlign: "center", padding: "40px 16px", color: "#5a5968" }}>

                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>✨</div>

                <div style={{ fontSize: 14, marginBottom: 8, color: "#7c7b89" }}>Sélectionnez un avis</div>

                <div style={{ fontSize: 13, lineHeight: 1.6 }}>Cliquez sur un avis pour générer une réponse avec Gemini.</div>

              </div>

            ) : (

              <>

                <div style={{ background: "#21212b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14 }}>

                  <Stars rating={selectedReview.rating} size={14} />

                  {selectedReview.comment && <div style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(238,237,244,0.85)", marginTop: 6 }}>&ldquo;{selectedReview.comment}&rdquo;</div>}

                  <div style={{ fontSize: 12, color: "#7c7b89", marginTop: 8 }}>— {selectedReview.authorName}</div>

                </div>



                <div>

                  <div style={{ fontSize: 12, color: "#7c7b89", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>

                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c5cfc", animation: "pulse 1.5s infinite" }} />

                    Ton de la réponse

                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>

                    {(["professionnel", "empathique", "concis"] as Tone[]).map((t) => (

                      <button key={t} className={`tone-btn${tone === t ? " active" : ""}`} onClick={() => setTone(t)}>

                        {t.charAt(0).toUpperCase() + t.slice(1)}

                      </button>

                    ))}

                  </div>

                </div>



                <div>

                  <div style={{ fontSize: 12, color: "#7c7b89", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>

                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c5cfc", animation: "pulse 1.5s infinite" }} />

                    Réponse générée

                  </div>

                  {!aiReply && !generating && (
                    <div style={{ background: "#21212b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14, fontSize: 13, minHeight: 120, color: "#5a5968", fontStyle: "italic" }}>
                      Cliquez sur &ldquo;Générer&rdquo;…
                    </div>
                  )}
                  {generating && !aiReply && (
                    <div style={{ background: "#21212b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14, fontSize: 13, minHeight: 120, color: "#7c7b89", fontStyle: "italic" }}>
                      Génération en cours<span className="ai-cursor" />
                    </div>
                  )}
                  {aiReply && (
                    <textarea
                      className="input-field"
                      rows={14}
                      value={aiReply + (generating ? " ▍" : "")}
                      onChange={(e) => setAiReply(e.target.value)}
                      readOnly={generating}
                      style={{ resize: "vertical", lineHeight: 1.65, minHeight: 120 }}
                    />
                  )}

                </div>



                <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => generateReply(selectedReview)} disabled={generating}>

                  {generating ? "Génération…" : "✨ Générer avec Gemini"}

                </button>

              </>

            )}

          </div>



          {aiReply && !generating && (

            <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 8 }}>

              {published ? (

                <div style={{ textAlign: "center", fontSize: 13, color: "#22c55e", padding: "10px 0" }}>✓ Réponse publiée sur {PLATFORM_META[selectedReview!.platform].label}</div>

              ) : (

                <>

                  {selectedReview!.platform === "google" && (
                    <button className="btn btn-primary" style={{ background: PLATFORM_META["google"].color }} onClick={publishReply}>
                      Publier sur Google
                    </button>
                  )}

                  <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => {
                    navigator.clipboard.writeText(aiReply);
                    showToast("Réponse copiée ✓", "success");
                  }}>
                    📋 Copier
                  </button>

                  <button className="btn btn-ghost" onClick={() => generateReply(selectedReview!)}>↺ Régénérer</button>

                </>

              )}

            </div>

          )}

        </div>

      </div>

    </div>

  );

}