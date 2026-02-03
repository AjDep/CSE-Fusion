# Frontend Table Selection → ML Model Sync

## Overview
A complete pipeline to dynamically select database tables in the frontend dashboard and automatically sync them to the ML models for processing.

## Architecture

### 1. Frontend (React Dashboard)
- **File**: `market-dashboard/src/pages/Dashboard.jsx`
- **Component**: `TableSelector` dropdown
- **Feature**: When user selects a table, it automatically syncs to the backend

### 2. Backend API (Node.js/Express)
- **New Endpoint**: `POST /api/sync-table-to-ml`
- **Location**: `bid-api/controllers/bidAskController.js`
- **Function**: Receives selected table name and saves it to `MLModels/selected_table.json`

### 3. ML Models Configuration
- **Config File**: `MLModels/config.py`
- **Features**:
  - Reads the selected table from `selected_table.json`
  - Fallback to CSV if no table is selected
  - Database connection parameters from environment variables

### 4. Data Loading
- **Loader**: `MLModels/db_loader.py`
- **Features**:
  - Attempts to load data from selected MySQL database table
  - Falls back to CSV file if database unavailable
  - Handles connection errors gracefully

## How It Works

1. **User selects table in dashboard**
   - Frontend: `Dashboard.jsx` → `TableSelector` component
   - User picks a table from dropdown

2. **Frontend syncs to backend**
   - Triggers `syncTableToML()` function
   - Sends POST request to `/api/sync-table-to-ml`
   - Body: `{ tableName: "bid_vs_ask_2026_02_03_01" }`

3. **Backend saves table selection**
   - Writes to `MLModels/selected_table.json`:
   ```json
   {
     "table_name": "bid_vs_ask_2026_02_03_01"
   }
   ```

4. **ML Models load correct data**
   - `config.py` reads `selected_table.json`
   - `db_loader.py` fetches data from MySQL table
   - Falls back to CSV if needed
   - Result: All ML models use the same selected table

## Updated Files

### Frontend
- ✅ `market-dashboard/src/pages/Dashboard.jsx` - Added table sync logic

### Backend
- ✅ `bid-api/controllers/bidAskController.js` - Added `syncTableToML()` method
- ✅ `bid-api/routes/bidAsk.js` - Added new endpoint

### ML Models
- ✅ `MLModels/config.py` - Made dynamic with JSON config reading
- ✅ `MLModels/db_loader.py` - New database loader with fallback
- ✅ `MLModels/Clasification/result.py` - Uses db_loader
- ✅ `MLModels/KMeans/result.py` - Uses db_loader
- ✅ `MLModels/Transformers/result.py` - Uses db_loader

## Usage

### For Frontend Users
1. Open dashboard
2. Select a table from the dropdown
3. Dashboard automatically syncs selection to ML models
4. Console shows: `✅ ML models synced: ML models synced to use table: bid_vs_ask_...`

### For Running ML Models
Simply run the model scripts as before:
```bash
python result.py  # Clasification
python result.py  # KMeans
python result.py  # Transformers
```

They will automatically:
- Check for a selected table in `selected_table.json`
- Load from MySQL database if available
- Fall back to CSV file if needed

## Environment Variables
Make sure `.env` file in MLModels has:
```
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=trading_db
DB_PORT=3306
```

## Benefits
✅ Single source of truth for data selection
✅ Frontend-driven data pipeline
✅ Database-first, CSV fallback
✅ No code changes needed when switching tables
✅ Seamless integration with existing systems
