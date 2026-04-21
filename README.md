# Tools 101

Tools 101 is an end-to-end market analytics and trading-signal platform that combines a React dashboard, a Node.js backend, and multiple machine learning models to analyze order-book data and generate actionable signals.

The project is designed to help users inspect market data, select source tables, and run automated analysis across three complementary ML pipelines: market regime detection with KMeans, price-direction classification, and momentum prediction with a Transformer model. Those outputs are then fused into a final trading decision and stored for later review.

## What It Includes

- A React frontend for browsing market data and viewing analysis results
- An Express backend for APIs, table sync, and data access
- ML pipelines for regime clustering, direction prediction, and momentum scoring
- Signal fusion logic that merges model outputs into final BUY, HOLD, or SELL recommendations
- MySQL-backed data storage and CSV fallback support for flexibility during development

## Purpose

The goal of the project is to turn raw bid/ask market data into clearer trading insight. It combines data ingestion, feature engineering, model training, inference, and reporting in one workflow so the full pipeline can be tested and improved in a single codebase.
