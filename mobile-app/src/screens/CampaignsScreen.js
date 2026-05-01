import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../api";

const GOLD = "#C8B56A";
const BG = "#0D0D0D";
const CARD = "#1A1A1A";
const BORDER = "#262626";
const FILTERS = ["all", "active", "upcoming", "ended"];

function timeLeft(endDate) {
  if (!endDate) return "";
  const diff = new Date(endDate) - Date.now();
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  return d > 0 ? (d + "d " + h + "h left") : (h + "h left");
}

export default function CampaignsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    try {
      const data = await api.request("/campaigns/");
      setCampaigns(Array.isArray(data) ? data : (data.results || []));
    } catch { setCampaigns([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const filtered = filter === "all" ? campaigns : campaigns.filter(c => c.status === filter);

  const renderItem = ({ item }) => {
    const isActive = item.status === "active";
    const btnLabel = isActive ? "View & Join" : item.status === "upcoming" ? "Coming Soon" : "View Results";
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("CampaignDetail", { campaignId: item.id })} activeOpacity={0.85}>
        {item.banner_image
          ? <Image source={{ uri: item.banner_image }} style={styles.banner} resizeMode="cover" />
          : <View style={[styles.banner, { backgroundColor: "#1A1200", justifyContent: "center", alignItems: "center" }]}><Ionicons name="trophy" size={40} color={GOLD} /></View>
        }
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          {!!item.description && <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>}
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}><Ionicons name="trophy-outline" size={14} color={GOLD} /><Text style={styles.metaText}>{item.prize_description || (item.prize_amount ? item.prize_amount + " ETB" : "Prize")}</Text></View>
            <View style={styles.metaItem}><Ionicons name="people-outline" size={14} color="#888" /><Text style={styles.metaText}>{(item.entries_count || 0) + " entries"}</Text></View>
            <View style={styles.metaItem}><Ionicons name="time-outline" size={14} color="#888" /><Text style={styles.metaText}>{timeLeft(item.end_date)}</Text></View>
          </View>
          <TouchableOpacity style={[styles.joinBtn, !isActive && styles.joinBtnDisabled]} onPress={() => navigation.navigate("CampaignDetail", { campaignId: item.id })}>
            <Text style={styles.joinBtnText}>{btnLabel}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color={GOLD} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Campaigns</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={GOLD} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => String(c.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCampaigns(); }} tintColor={GOLD} />}
          contentContainerStyle={{ padding: 12, gap: 14 }}
          ListEmptyComponent={<View style={styles.centered}><Ionicons name="trophy-outline" size={48} color="#333" /><Text style={styles.emptyText}>No campaigns found</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { fontSize: 18, fontWeight: "700", color: GOLD },
  filterRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER },
  filterChipActive: { backgroundColor: GOLD, borderColor: GOLD },
  filterText: { color: "#888", fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: "#000", fontWeight: "700" },
  card: { backgroundColor: CARD, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: BORDER },
  banner: { width: "100%", height: 160 },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#fff", marginBottom: 6 },
  cardDesc: { fontSize: 13, color: "#888", lineHeight: 18, marginBottom: 12 },
  cardMeta: { flexDirection: "row", gap: 14, marginBottom: 14, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#888" },
  joinBtn: { backgroundColor: GOLD, borderRadius: 12, padding: 13, alignItems: "center" },
  joinBtnDisabled: { backgroundColor: "#333" },
  joinBtnText: { color: "#000", fontWeight: "800", fontSize: 14 },
  emptyText: { color: "#666", marginTop: 12, fontSize: 14 },
});
