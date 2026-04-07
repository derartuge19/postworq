import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('TikTokLayout') || id.includes('TikTokLayout.css')) {
            return 'chunk-feed';
          }
          if (
            id.includes('ProfilePage') ||
            id.includes('EditProfilePage') ||
            id.includes('FollowersListPage')
          ) {
            return 'chunk-profile';
          }
          if (
            id.includes('CampaignsPage') ||
            id.includes('CampaignDetailPage') ||
            id.includes('CampaignLeaderboard') ||
            id.includes('CampaignFeed') ||
            id.includes('CampaignStats')
          ) {
            return 'chunk-campaigns';
          }
          if (id.includes('AdminApp') || id.includes('/admin/')) {
            return 'chunk-admin';
          }
        },
      },
    },
    chunkSizeWarning: 500,
  },
  base: './'
})
