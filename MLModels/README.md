# ML Models Pipeline

Market data analysis using three complementary ML models for trading signal generation.

## Project Structure

```
MLModels/
├── train_all.py                 # Main orchestrator - runs all models sequentially
├── bid_api_client.py            # API client to fetch data from backend
├── config.py                    # Configuration (API URLs, DB settings)
├── feature_engineering.py       # Feature helper functions (OBI calculation)
├── .env                         # Environment variables
│
├── KMeans/                      # Market Regime Clustering Model
│   ├── train.py                 # Training script
│   ├── market_regime_model.py   # Model definition and helpers
│   ├── predict.py               # Inference
│   ├── cluster_labels.py        # Cluster to regime mapping
│   ├── result.py                # Result processing
│   └── models/                  # Saved models (kmeans.pkl, scaler.pkl)
│
├── Clasification/               # Price Direction Classifier (Gradient Boosting)
│   ├── train_price_model.py     # Training script
│   ├── price_direction_model.py # Model definition and helpers
│   ├── predict_price.py         # Inference
│   ├── result.py                # Result processing
│   └── models/                  # Saved models (gb_price_direction.pkl, scaler.pkl)
│
├── Transformers/                # Momentum Predictor (PyTorch Transformer)
│   ├── train_transformer.py     # Training script
│   ├── model.py                 # Model architecture
│   ├── predict_transformer.py   # Inference
│   ├── aggregate_transformer.py # Aggregation logic
│   ├── result.py                # Result processing
│   └── models/                  # Saved models (transformer.pt, transformer_scaler.pkl)
│
├── MergeModels/                 # Signal Fusion Engine
│   ├── run_fusion.py            # Main fusion orchestrator
│   ├── merge_models.py          # Merge logic
│   ├── decision_engine.py       # Final decision logic
│   ├── llm_analyzer.py          # AI-powered analysis
│   └── outputs/                 # Final reports and signals
│
├── DataSets/                    # Downloaded datasets for reference
├── outputs/                     # Generated outputs (reports, signals)
└── .gitignore                   # Git ignore rules
```

## Features Used

Models are trained on these features extracted from order book data:

| Feature | Description | Source |
|---------|-------------|--------|
| `diff_percent` | Percentage difference between bid and ask | Direct |
| `ppl_dominance` | People (retail) dominance metric | Direct |
| `obi` | Order Book Imbalance | Calculated from bid/ask quantities |
| `total_bid` | Total bid volume | Direct |
| `total_ask` | Total ask volume | Direct |
| `tot_turnover` | Total turnover (added 2026-04-15, sparse data) | Direct |
| `tot_volume` | Total volume (added 2026-04-15, sparse data) | Direct |

**Note**: `tot_turnover` and `tot_volume` are 92% NaN due to recent addition. These should be removed until sufficient historical data exists (2+ weeks).

## Three Models

### 1. KMeans (Market Regime)
- **Purpose**: Cluster market into 4 regimes (Accumulation, Momentum, Panic, Neutral)
- **Algorithm**: K-Means clustering (4 clusters)
- **Features**: 5 core features
- **Output**: Market regime label for each security
- **Files**: `KMeans/train.py`, `KMeans/predict.py`

### 2. GradientBoosting Classifier (Price Direction)
- **Purpose**: Predict if next price tick will go UP or DOWN
- **Algorithm**: GradientBoostingClassifier (scikit-learn)
- **Features**: 7 features (5 core + 2 missing ones)
- **Output**: Price direction probability (0=DOWN, 1=UP)
- **Files**: `Clasification/train_price_model.py`, `Clasification/predict_price.py`

### 3. Transformer (Momentum)
- **Purpose**: Predict momentum and trend continuation
- **Algorithm**: PyTorch Transformer on 5-timestep sequences
- **Features**: 7 features over time windows
- **Output**: Momentum score and trend (BUY/HOLD/SELL)
- **Files**: `Transformers/train_transformer.py`, `Transformers/predict_transformer.py`

## Running the Pipeline

### Full Training (All Models)
```bash
python train_all.py
```

Runs sequentially:
1. KMeans training
2. Classifier training  
3. Transformer training
4. Signal fusion and merging
5. Final trading signal generation

### Individual Model Training
```bash
# KMeans
python KMeans/train.py

# Classifier
python Clasification/train_price_model.py

# Transformer
python Transformers/train_transformer.py
```

### Inference Only (No Training)
```bash
# This is called automatically by train_all.py after training
python KMeans/predict.py
python Clasification/predict_price.py
python Transformers/predict_transformer.py
python MergeModels/run_fusion.py
```

### Full Fusion (Merge Models + Generate Signals)
```bash
python MergeModels/run_fusion.py
```

## Data Flow

```
bid_api_client.load_with_fallback()
        ↓
    Raw data (16k+ rows)
        ↓
    feature_engineering.add_obi()
        ↓
    KMeans model → Market Regime
    Classifier model → Price Direction
    Transformer model → Momentum
        ↓
    MergeModels/merge_models.py
        ↓
    MergeModels/decision_engine.py
        ↓
    Final Trading Signals → Database (ml_trading_signals table)
```

## Output

Final trading signals saved to MySQL:
- **Table**: `ml_trading_signals`
- **Columns**: security, regime, final_signal, (model scores)
- **Signals**: 🔻 SELL, ⚖️ HOLD, 🟢 BUY (merged from all 3 models)

## Configuration

Edit `.env` or `config.py`:
- API endpoint (backend URL)
- Database credentials (MySQL)
- Model hyperparameters (epochs, learning rate, etc.)

## Issues & TODOs

### Current Limitations
- ⚠️ `tot_turnover`/`tot_volume` are 92% NaN → causes model bias
- ⚠️ Feature correlation very weak (near zero) → low signal quality
- ⚠️ 2:1 class imbalance (DOWN 67% vs UP 33%) → models default to SELL

### Recommended Improvements
1. **Remove sparse features** (tot_turnover/tot_volume) until 2+ weeks of data
2. **Engineer better features**:
   - Bid-ask spread momentum
   - Volume trend changes
   - Price velocity/acceleration
3. **Apply class weighting** in classifier to handle imbalance
4. **Collect more historical data** for better training

## Environment

- **Python**: 3.11+
- **Dependencies**: torch, scikit-learn, pandas, numpy, joblib
- **Backend**: Node.js/Express (port 5000)
- **Database**: MySQL (market_data)
