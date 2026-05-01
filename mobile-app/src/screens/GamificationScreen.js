import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Animated, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../api";

const GOLD = "#C8B56A";
const BG = "#0D0D0D";
const CARD = "#1A1A1A";
const BORDER = "#262626";

export default function GamificationScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState(null);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadAll(); }, []);

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    const [s, q] = await Promise.all([
      api.request("/gamification/status/").catch(() => null),
      api.request("/quests/").catch(() => []),
    ]);
    setStatus(s);
    setQuests(Array.isArray(q) ? q : (q?.results || []));
    setLoading(false);
    setRefreshing(false);
  };

  const claimBonus = async () => {
    setClaimingBonus(true);
    try {
      const res = await api.request("/gamification/login-bonus/", { method: "POST" });
      Alert.alert("Bonus Claimed!", `You earned ${res.coins_earned || res.coins || 0} coins!`);
      loadAll(true);
    } catch (e) {
      Alert.alert("Error", e?.message || "Could not claim bonus.");
    } finally {
      setClaimingBonus(false);
    }
  };

  const doSpin = async () => {
    setSpinning(true);
    setSpinResult(null);
    Animated.timing(spinAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    try {
      const res = await api.request("/gamification/perform-spin/", { method: "POST" });
      setSpinResult(res);
      Alert.alert("Spin Result!", `You won ${res.coins_won || res.coins || 0} coins!`);
      loadAll(true);
    } catch (e) {
      Alert.alert("Error", e?.message || "Could not perform spin.");
    } finally {
      setSpinning(false);
      spinAnim.setValue(0);
    }
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={GOLD} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gamification</Text>
        <TouchableOpacity onPress={() => loadAll(true)}>
          <Ionicons name="refresh" size={22} color={GOLD} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAll(true)} tintColor={GOLD} />}
      >
        {/* Coins & Level */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="logo-bitcoin" size={28} color={GOLD} />
            <Text style={styles.statValue}>{status?.coins ?? 0}</Text>
            <Text style={styles.statLabel}>Coins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="star" size={28} color={GOLD} />
            <Text style={styles.statValue}>{status?.level ?? 1}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="flame" size={28} color="#EF4444" />
            <Text style={styles.statValue}>{status?.streak ?? 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {/* Login Bonus */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Login Bonus</Text>
          <TouchableOpacity
            style={[styles.actionBtn, claimingBonus && { opacity: 0.6 }]}
            onPress={claimBonus}
            disabled={claimingBonus}
          >
            {claimingBonus
              ? <ActivityIndicator size="small" color="#000" />
              : <><Ionicons name="gift-outline" size={18} color="#000" /><Text style={styles.actionBtnText}>Claim Bonus</Text></>
            }
          </TouchableOpacity>
        </View>

        {/* Daily Spin */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Spin</Text>
          <View style={styles.spinContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="refresh-circle" size={80} color={GOLD} />
            </Animated.View>
            <TouchableOpacity
              style={[styles.actionBtn, { marginTop: 16 }, spinning && { opacity: 0.6 }]}
              onPress={doSpin}
              disabled={spinning}
            >
              {spinning
                ? <ActivityIndicator size="small" color="#000" />
                : <><Ionicons name="dice-outline" size={18} color="#000" /><Text style={styles.actionBtnText}>Spin Now</Text></>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Quests */}
        {quests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quests</Text>
            {quests.map((q) => (
              <View key={q.id} style={styles.questCard}>
                <View style={styles.questInfo}>
                  <Text style={styles.questTitle}>{q.title || q.name}</Text>
                  {!!q.description && <Text style={styles.questDesc}>{q.description}</Text>}
                </View>
                <View style={styles.questReward}>
                  <Ionicons name="logo-bitcoin" size={14} color={GOLD} />
                  <Text style={styles.questRewardText}>{q.reward_coins || q.coins || 0}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { fontSize: 18, fontWeight: "700", color: GOLD },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  statsCard: { flexDirection: "row", backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 20, alignItems: "center" },
  statItem: { flex: 1, alignItems: "center", gap: 6 },
  statValue: { fontSize: 22, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 12, color: "#666", fontWeight: "600" },
  statDivider: { width: 1, height: 50, backgroundColor: BORDER },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: GOLD },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: GOLD, borderRadius: 14, padding: 14 },
  actionBtnText: { color: "#000", fontWeight: "800", fontSize: 15 },
  spinContainer: { alignItems: "center", backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 24 },
  questCard: { flexDirection: "row", alignItems: "center", backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 14 },
  questInfo: { flex: 1 },
  questTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  questDesc: { fontSize: 12, color: "#888", marginTop: 2 },
  questReward: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#1A1200", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  questRewardText: { color: GOLD, fontWeight: "700", fontSize: 13 },
});
