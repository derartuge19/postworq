import { useState, useEffect } from "react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { Trophy, Crown, Award } from "lucide-react";

export function CampaignWinnersSection({ campaignId, campaignType }) {
  const { colors: T } = useTheme();
  const [selections, setSelections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!campaignId) return;
    loadWinners();
  }, [campaignId, campaignType]);

  const loadWinners = async () => {
    try {
      setLoading(true);
      const data = await api.getCampaignWinners(campaignId, campaignType);
      setSelections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load campaign winners:", err);
      setError("Unable to load winners");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "48px 20px", textAlign: "center", color: T.sub }}>
        Loading winners...
      </div>
    );
  }

  if (error || selections.length === 0) {
    return (
      <div style={{
        padding: "48px 20px",
        textAlign: "center",
        color: T.sub,
        background: T.card,
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        margin: "20px",
      }}>
        <Trophy size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
          {error || "No winners yet"}
        </div>
        {campaignType && (
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Winners will appear here once the {campaignType} campaign is completed.
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ margin: "20px" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
      }}>
        <Trophy size={20} color={T.pri} strokeWidth={2.5} />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.txt }}>
          Winners
        </h2>
      </div>

      {selections.map((selection) => (
        <div
          key={selection.selection_id}
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: T.sub,
                textTransform: "uppercase",
                marginBottom: 4,
              }}>
                {selection.selection_type} • {new Date(selection.finalized_at).toLocaleDateString()}
              </div>
              <div style={{ fontSize: 14, color: T.txt }}>
                {selection.winners?.length || 0} winner{selection.winners?.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selection.winners?.map((winner) => (
              <div
                key={`${winner.rank}-${winner.user.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: winner.rank === 1 ? "#F59E0B" : winner.rank === 2 ? "#9CA3AF" : winner.rank === 3 ? "#B45309" : T.pri,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 14,
                }}>
                  #{winner.rank}
                </div>
                <div>
                  <div style={{ color: T.txt, fontWeight: 800, fontSize: 14 }}>
                    @{winner.user.username}
                  </div>
                  <div style={{ color: T.sub, fontSize: 12, marginTop: 2 }}>
                    Score: {winner.final_score}
                  </div>
                  {winner.cooldown_until && (
                    <div style={{ color: T.sub, fontSize: 11, marginTop: 2 }}>
                      🚫 Cooldown until {new Date(winner.cooldown_until).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: T.green, fontWeight: 800, fontSize: 13 }}>
                    {winner.prize_value || "Prize"}
                  </div>
                  <div style={{ color: T.sub, fontSize: 11, textTransform: "uppercase", marginTop: 3 }}>
                    {winner.prize_type || "other"}
                  </div>
                  {winner.prize_claimed && (
                    <div style={{ color: T.green, fontSize: 10, marginTop: 3 }}>✅ Claimed</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
