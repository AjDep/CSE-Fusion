"""
LLM-based analyzer for trading signal descriptions and insights.
Supports OpenAI API and template-based fallback.
"""

import os
import pandas as pd
from typing import Optional, Dict, List


class SignalAnalyzer:
    """Generates natural language descriptions of trading signals."""

    def __init__(self, use_openai: bool = False, api_key: Optional[str] = None):
        self.use_openai = use_openai and api_key is not None
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        
        if self.use_openai and self.api_key:
            try:
                import openai
                openai.api_key = self.api_key
                self.openai = openai
            except ImportError:
                print("⚠️ OpenAI library not installed. Using template-based analysis.")
                self.use_openai = False
        else:
            self.use_openai = False

    def analyze_signals(self, final_df: pd.DataFrame) -> Dict[str, any]:
        """
        Analyze trading signals and generate insights.
        
        Args:
            final_df: DataFrame with columns: security, regime, final_signal
        
        Returns:
            Dictionary with insights, summaries, and individual signal descriptions
        """
        
        # Extract signal distribution
        signal_counts = final_df["final_signal"].value_counts()
        regime_counts = final_df["regime"].value_counts()
        
        # Group signals by recommendation
        buys = final_df[final_df["final_signal"].str.contains("BUY", na=False)]
        sells = final_df[final_df["final_signal"].str.contains("SELL", na=False)]
        holds = final_df[final_df["final_signal"] == "⚖️ HOLD"]
        
        strong_buys = final_df[final_df["final_signal"] == "🟢 STRONG BUY"]
        
        analysis = {
            "summary": self._generate_summary(
                signal_counts, regime_counts, len(final_df),
                len(buys), len(sells), len(holds), len(strong_buys)
            ),
            "signal_distribution": {
                "total_securities": len(final_df),
                "buy_count": len(buys),
                "strong_buy_count": len(strong_buys),
                "sell_count": len(sells),
                "hold_count": len(holds),
                "buy_pct": round(len(buys) / len(final_df) * 100, 1),
                "sell_pct": round(len(sells) / len(final_df) * 100, 1),
                "hold_pct": round(len(holds) / len(final_df) * 100, 1),
            },
            "regime_breakdown": regime_counts.to_dict(),
            "strong_buy_securities": strong_buys[["security", "regime"]].to_dict("records"),
            "buy_securities": buys[buys["final_signal"] == "🟢 BUY"][["security", "regime"]].to_dict("records"),
            "top_sell_securities": sells.head(10)[["security", "regime"]].to_dict("records"),
        }
        
        return analysis

    def _generate_summary(
        self, 
        signal_counts, 
        regime_counts, 
        total,
        buy_count,
        sell_count, 
        hold_count, 
        strong_buy_count
    ) -> str:
        """Generate natural language summary of signals."""
        
        if self.use_openai:
            return self._generate_summary_llm(
                signal_counts, regime_counts, total, 
                buy_count, sell_count, hold_count, strong_buy_count
            )
        else:
            return self._generate_summary_template(
                signal_counts, regime_counts, total,
                buy_count, sell_count, hold_count, strong_buy_count
            )

    def _generate_summary_template(
        self,
        signal_counts,
        regime_counts,
        total,
        buy_count,
        sell_count,
        hold_count,
        strong_buy_count
    ) -> str:
        """Template-based summary generation (no LLM required)."""
        
        buy_pct = round(buy_count / total * 100, 1)
        sell_pct = round(sell_count / total * 100, 1)
        hold_pct = round(hold_count / total * 100, 1)
        
        dominant_regime = list(regime_counts.index)[0] if len(regime_counts) > 0 else "Unknown"
        
        summary = f"""
📊 TRADING SIGNAL ANALYSIS REPORT
{'='*60}

Market Overview:
  • Total Securities Analyzed: {total}
  • Dominant Market Regime: {dominant_regime}
  • Regime Distribution: {', '.join([f"{k}: {v}" for k, v in regime_counts.head(3).to_dict().items()])}

Signal Distribution:
  • 🟢 BUY Signals: {buy_count} ({buy_pct}%)
  • 🟢 STRONG BUY: {strong_buy_count} (High-Confidence)
  • 🔻 SELL Signals: {sell_count} ({sell_pct}%)
  • ⚖️ HOLD Signals: {hold_count} ({hold_pct}%)

Market Assessment:
"""
        
        if buy_pct > 30:
            summary += "  ✓ BULLISH BIAS: Strong buying opportunities detected across multiple regimes.\n"
        elif buy_pct > 15:
            summary += "  ⊕ MIXED SENTIMENT: Selective buying opportunities in specific regimes.\n"
        else:
            summary += "  ⊖ BEARISH BIAS: Market showing limited buying signals, mostly defensive/exit.\n"
        
        if strong_buy_count > 0:
            summary += f"  ★ NOTABLE: {strong_buy_count} securities show exceptional buy convergence (Whale + Classifier agreement).\n"
        
        if "🐳 Whale Accumulation" in regime_counts.index:
            whale_count = regime_counts["🐳 Whale Accumulation"]
            summary += f"  🐳 Whale Activity: {whale_count} securities in accumulation phase - potential long-term plays.\n"
        
        if "🛑 Panic Crash" in regime_counts.index:
            panic_count = regime_counts["🛑 Panic Crash"]
            summary += f"  ⚠️ Risk Alert: {panic_count} securities in panic phase - avoid unless high conviction.\n"
        
        summary += f"""
Recommendation:
  • Focus on {strong_buy_count + buy_count} positively-rated securities.
  • Exercise caution on {sell_count} declining securities.
  • {hold_count} securities warrant further analysis before commitment.

{'='*60}
"""
        return summary

    def _generate_summary_llm(
        self,
        signal_counts,
        regime_counts,
        total,
        buy_count,
        sell_count,
        hold_count,
        strong_buy_count
    ) -> str:
        """Generate summary using OpenAI API."""
        
        try:
            prompt = f"""
You are a professional market analyst. Analyze this trading signal distribution and provide 
a concise, actionable market assessment in 4-6 sentences.

Data:
- Total Securities: {total}
- Buy Signals: {buy_count} ({round(buy_count/total*100, 1)}%)
- Strong Buy: {strong_buy_count}
- Sell Signals: {sell_count} ({round(sell_count/total*100, 1)}%)
- Hold Signals: {hold_count} ({round(hold_count/total*100, 1)}%)
- Regime Distribution: {dict(regime_counts.head(5))}

Provide a market summary suitable for a trading dashboard.
"""
            
            response = self.openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a financial market analyst."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            return response["choices"][0]["message"]["content"]
        
        except Exception as e:
            print(f"⚠️ LLM request failed ({e}). Falling back to template-based analysis.")
            return self._generate_summary_template(
                signal_counts, regime_counts, total,
                buy_count, sell_count, hold_count, strong_buy_count
            )

    def generate_signal_descriptions(self, final_df: pd.DataFrame, top_n: int = 5) -> List[str]:
        """
        Generate individual descriptions for top signals.
        
        Args:
            final_df: Trading signals DataFrame
            top_n: Number of top recommendations to describe
        
        Returns:
            List of natural language descriptions
        """
        
        descriptions = []
        
        # Strong buys
        strong_buys = final_df[final_df["final_signal"] == "🟢 STRONG BUY"]
        if len(strong_buys) > 0:
            for _, row in strong_buys.head(top_n).iterrows():
                desc = f"🟢 STRONG BUY: {row['security']} - {row['regime']} regime showing exceptional convergence (whale accumulation + positive classifier agreement)."
                descriptions.append(desc)
        
        # Regular buys
        buys = final_df[(final_df["final_signal"] == "🟢 BUY") & (final_df["regime"] == "🐳 Whale Accumulation")]
        if len(buys) > 0:
            for _, row in buys.head(top_n).iterrows():
                desc = f"🟢 BUY: {row['security']} - Whale accumulation pattern detected with favorable market momentum."
                descriptions.append(desc)
        
        # Top sells (for risk awareness)
        sells = final_df[final_df["final_signal"] == "🔻 SELL"]
        if len(sells) > 0:
            for _, row in sells.head(3).iterrows():
                regime_desc = "panic phase" if "Panic" in row["regime"] else "declining momentum"
                desc = f"🔻 SELL: {row['security']} - {regime_desc}, recommend exit or avoid entry."
                descriptions.append(desc)
        
        return descriptions[:top_n * 2]


def format_analysis_report(analysis: Dict) -> str:
    """Format analysis dictionary into a readable report."""
    
    report = analysis["summary"]
    
    if analysis["strong_buy_securities"]:
        report += "\n🌟 TOP OPPORTUNITIES (Strong Buy Convergence):\n"
        for item in analysis["strong_buy_securities"][:5]:
            report += f"   • {item['security']} ({item['regime']})\n"
    
    if analysis["buy_securities"]:
        report += "\n📈 BUY CANDIDATES:\n"
        buy_list = analysis["buy_securities"][:5]
        if buy_list:
            for item in buy_list:
                report += f"   • {item['security']} ({item['regime']})\n"
    
    if analysis["top_sell_securities"]:
        report += "\n⚠️ SECURITIES TO AVOID/EXIT:\n"
        for item in analysis["top_sell_securities"][:5]:
            report += f"   • {item['security']} ({item['regime']})\n"
    
    return report


if __name__ == "__main__":
    # Example usage
    sample_data = pd.DataFrame({
        "security": ["TAJ.N0000", "SOY.N0000", "HAYC.N0000"],
        "regime": ["🐳 Whale Accumulation", "🚀 Retail Momentum", "🐳 Whale Accumulation"],
        "final_signal": ["🟢 STRONG BUY", "🔻 SELL", "🟢 BUY"]
    })
    
    analyzer = SignalAnalyzer(use_openai=False)
    analysis = analyzer.analyze_signals(sample_data)
    report = format_analysis_report(analysis)
    print(report)
