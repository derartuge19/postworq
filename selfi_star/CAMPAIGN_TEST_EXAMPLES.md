# Campaign Test Examples

## How to Create a Campaign (Admin Panel)

1. Go to `http://localhost:5173/#/admin`
2. Login with admin credentials:
   - Email: `admin@selfiestar.com`
   - Password: `admin123`
3. Navigate to **Campaign Management** in the sidebar
4. Click **Create Campaign** button
5. Fill in the form with the examples below
6. Click **Create Campaign**

---

## Example 1: Summer Photo Contest 🌞

### Basic Info
- **Campaign Title**: `Summer Vibes Photo Contest 2024`
- **Description**: `Share your best summer moments! Capture the essence of summer - beaches, sunsets, adventures, or fun with friends. The most creative and engaging photo wins!`

### Prize Details
- **Prize Title**: `$500 Cash Prize + Featured Profile`
- **Prize Value**: `500`

### Timeline (Use dates in the future)
- **Start Date**: `2024-04-01T09:00` (April 1, 2024, 9:00 AM)
- **Entry Deadline**: `2024-04-15T23:59` (April 15, 2024, 11:59 PM)
- **Voting Start**: `2024-04-16T00:00` (April 16, 2024, 12:00 AM)
- **Voting End**: `2024-04-30T23:59` (April 30, 2024, 11:59 PM)

### Additional Settings
- **Status**: `active` (or `draft` if you want to publish later)
- **Minimum Followers**: `0` (open to all)
- **Minimum Level**: `1`
- **Winner Count**: `3` (Top 3 winners)

---

## Example 2: Dance Challenge 💃

### Basic Info
- **Campaign Title**: `Ultimate Dance Challenge`
- **Description**: `Show us your best dance moves! Whether it's hip-hop, ballet, contemporary, or freestyle - we want to see your talent shine. Most creative choreography wins!`

### Prize Details
- **Prize Title**: `$1000 Grand Prize + Dance Workshop`
- **Prize Value**: `1000`

### Timeline
- **Start Date**: `2024-04-05T10:00`
- **Entry Deadline**: `2024-04-20T23:59`
- **Voting Start**: `2024-04-21T00:00`
- **Voting End**: `2024-05-05T23:59`

### Additional Settings
- **Status**: `active`
- **Minimum Followers**: `100` (requires 100 followers)
- **Minimum Level**: `2`
- **Winner Count**: `1`

---

## Example 3: Food Photography Contest 🍕

### Basic Info
- **Campaign Title**: `Delicious Food Photography Contest`
- **Description**: `Calling all food lovers! Share your most mouth-watering food photos. Whether it's homemade dishes, restaurant meals, or street food - make us hungry!`

### Prize Details
- **Prize Title**: `$300 Cash + Restaurant Gift Cards`
- **Prize Value**: `300`

### Timeline
- **Start Date**: `2026-04-10T08:00`
- **Entry Deadline**: `2026-04-25T23:00`
- **Voting Start**: `2026-04-26T00:00`
- **Voting End**: `2026-05-10T23:00`

### Additional Settings
- **Status**: `active`
- **Minimum Followers**: `0`
- **Minimum Level**: `1`
- **Winner Count**: `5` (Top 5 winners)

---

## Example 4: Pet Photos Contest 🐶

### Basic Info
- **Campaign Title**: `Cutest Pet Photo Contest`
- **Description**: `Share adorable photos of your furry (or not so furry) friends! Dogs, cats, birds, hamsters - all pets welcome. The cutest pet wins hearts and prizes!`

### Prize Details
- **Prize Title**: `$250 Cash + Pet Store Voucher`
- **Prize Value**: `250`

### Timeline
- **Start Date**: `2024-04-01T00:00`
- **Entry Deadline**: `2024-04-14T23:59`
- **Voting Start**: `2024-04-15T00:00`
- **Voting End**: `2024-04-28T23:59`

### Additional Settings
- **Status**: `active`
- **Minimum Followers**: `50`
- **Minimum Level**: `1`
- **Winner Count**: `3`

---

## Example 5: Travel Photography 🌍

### Basic Info
- **Campaign Title**: `World Traveler Photo Contest`
- **Description**: `Share your most stunning travel photos from around the world! Landscapes, cityscapes, cultural moments, or adventure shots - show us the beauty of our planet!`

### Prize Details
- **Prize Title**: `$750 Travel Voucher + Camera Gear`
- **Prize Value**: `750`

### Timeline
- **Start Date**: `2026-04-15` at `12:00 PM`
- **Entry Deadline**: `2026-05-01` at `11:00 PM`
- **Voting Start**: `2026-05-02` at `12:00 AM`
- **Voting End**: `2026-05-20` at `11:00 PM`

### Additional Settings
- **Status**: `draft` (will activate later)
- **Minimum Followers**: `200`
- **Minimum Level**: `3`
- **Winner Count**: `3`

---

## Quick Test Campaign (For Immediate Testing)

### Basic Info
- **Campaign Title**: `Test Campaign - Quick Entry`
- **Description**: `This is a test campaign to verify the system works correctly. Share any photo or video!`

### Prize Details
- **Prize Title**: `$100 Test Prize`
- **Prize Value**: `100`

### Timeline (Use current dates)
- **Start Date**: Today's date at current time
- **Entry Deadline**: Tomorrow's date at 23:59
- **Voting Start**: Day after tomorrow at 00:00
- **Voting End**: 3 days from now at 23:59

### Additional Settings
- **Status**: `active`
- **Minimum Followers**: `0`
- **Minimum Level**: `1`
- **Winner Count**: `1`

---

## Important Notes

1. **Date Format**: Use `YYYY-MM-DDTHH:MM` format (e.g., `2024-04-15T14:30`)
2. **Timeline Logic**: 
   - Start Date < Entry Deadline < Voting Start < Voting End
   - Entry phase: Start Date → Entry Deadline
   - Voting phase: Voting Start → Voting End
3. **Status Options**:
   - `draft`: Not visible to users yet
   - `active`: Users can submit entries
   - `voting`: Entry closed, voting open
   - `completed`: Campaign ended
4. **Winner Count**: Number of top entries that will win prizes
5. **Minimum Requirements**: Set to 0 to allow all users to participate

---

## After Creating a Campaign

1. **View on User Side**: Go to `http://localhost:5173` and click Campaigns
2. **Submit Entry**: Users can click on active campaigns and submit their reels
3. **Vote**: During voting phase, users can vote for their favorite entries
4. **Announce Winners**: Admin can announce winners from the Campaign Management page

---

## Testing Workflow

1. Create a campaign with **Status: active**
2. As a regular user, go to Campaigns page
3. Click on the campaign to view details
4. Submit a reel entry (you'll need to have posted reels first)
5. Switch campaign status to **voting** (edit campaign or wait for voting period)
6. Vote for entries
7. As admin, click **Announce Winners** button
8. Check winners are displayed correctly

Enjoy testing the campaign system! 🎉
