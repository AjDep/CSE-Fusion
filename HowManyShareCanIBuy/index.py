import tkinter as tk
from tkinter import messagebox
import math

# ================= GLOBAL STATE =================
shares = 0
total_buy_cost = 0.0
sell_shares = 0

# ================= LOGIC =================

def calculate_shares():
    global shares, total_buy_cost, sell_shares
    try:
        amount = float(amount_entry.get())
        price = float(price_entry.get())
        service_charge = float(charge_entry.get()) / 100

        shares = int(amount / (price * (1 + service_charge)))
        total_buy_cost = shares * price * (1 + service_charge)
        balance = amount - total_buy_cost

        shares_value.config(text=str(shares))
        total_cost_value.config(text=f"Rs. {total_buy_cost:,.2f}")
        balance_value.config(text=f"Rs. {balance:,.2f}")

        sell_shares_entry.delete(0, tk.END)
        sell_shares_entry.insert(0, str(shares))

        result_frame.pack(fill="x", pady=8)
        copy_btn.config(state="normal")

    except ValueError:
        messagebox.showerror("Invalid Input", "Please enter valid numbers.")

def calculate_profit():
    global sell_shares
    try:
        if shares == 0:
            messagebox.showwarning("No Purchase", "Please calculate your purchase first.")
            return

        sell_price = float(sell_price_entry.get())
        commission = 0.0112

        sell_input = sell_shares_entry.get().strip()
        sell_shares = shares if sell_input == "" else int(sell_input)

        if sell_shares <= 0 or sell_shares > shares:
            messagebox.showerror("Invalid Shares", "Invalid number of shares to sell.")
            return

        total_sell = sell_shares * sell_price * (1 - commission)
        buy_cost_part = (sell_shares / shares) * total_buy_cost

        profit = total_sell - buy_cost_part
        roi = (profit / buy_cost_part) * 100

        show_profit(total_sell, profit, roi)
        cash_result_frame.pack_forget()

    except ValueError:
        messagebox.showerror("Invalid Input", "Please enter valid numbers.")

def calculate_cash_out():
    try:
        if shares == 0:
            messagebox.showwarning("No Purchase", "Please calculate your purchase first.")
            return

        sell_price = float(sell_price_entry.get())
        cash_needed = float(cash_out_entry.get())
        commission = 0.0112

        net_per_share = sell_price * (1 - commission)
        shares_needed = math.ceil(cash_needed / net_per_share)

        if shares_needed > shares:
            messagebox.showerror(
                "Not Possible",
                f"You need {shares_needed} shares but only own {shares}."
            )
            return

        total_sell = shares_needed * net_per_share
        buy_cost_part = (shares_needed / shares) * total_buy_cost

        profit = total_sell - buy_cost_part
        roi = (profit / buy_cost_part) * 100

        sell_shares_needed_value.config(text=str(shares_needed))
        show_profit(total_sell, profit, roi)
        cash_result_frame.pack(fill="x", pady=8)

    except ValueError:
        messagebox.showerror("Invalid Input", "Please enter valid numbers.")

def show_profit(total_sell, profit, roi):
    status = "Profit" if profit >= 0 else "Loss"
    color = "#27ae60" if profit >= 0 else "#e74c3c"
    icon = "📈" if profit >= 0 else "📉"

    sell_total_value.config(text=f"Rs. {total_sell:,.2f}")
    profit_label.config(text=f"{icon} Net {status}", fg=color)
    profit_value.config(text=f"Rs. {abs(profit):,.2f}", fg=color)
    roi_value.config(text=f"{roi:+.2f}%", fg=color)

    profit_frame.pack(fill="x", pady=8)

# ================= UI =================

root = tk.Tk()
root.title("Stock Profit & Cash-Out Calculator")
root.geometry("900x680")
root.configure(bg="#ecf0f1")
root.resizable(False, False)

# Header
tk.Label(
    root,
    text="📊 Stock Profit, ROI & Cash-Out Calculator",
    font=("Segoe UI", 16, "bold"),
    bg="#3498db",
    fg="white",
    pady=12
).pack(fill="x")

main = tk.Frame(root, bg="#ecf0f1")
main.pack(fill="both", expand=True, padx=15, pady=12)

# ---------- LEFT: BUY ----------
left = tk.Frame(main, bg="#ecf0f1")
left.pack(side="left", fill="both", expand=True, padx=8)

tk.Label(left, text="💰 Purchase Calculator", font=("Segoe UI", 12, "bold"), bg="#ecf0f1", fg="#2c3e50").pack(pady=(0, 8))

buy_card = tk.Frame(left, bg="#ffffff", relief="solid", bd=1)
buy_card.pack(fill="x")

def labeled_entry(parent, label, default=None):
    frame = tk.Frame(parent, bg="#ffffff")
    frame.pack(fill="x", padx=12, pady=6)
    tk.Label(frame, text=label, font=("Segoe UI", 9), bg="#ffffff", fg="#34495e").pack(anchor="w")
    e = tk.Entry(frame, font=("Segoe UI", 10), relief="solid", bd=1)
    e.pack(fill="x", ipady=3)
    if default:
        e.insert(0, default)
    return e

amount_entry = labeled_entry(buy_card, "💵 Total Money (LKR)")
price_entry = labeled_entry(buy_card, "💰 Share Price (LKR)")
charge_entry = labeled_entry(buy_card, "📊 Service Charge (%)", "1.12")

tk.Frame(buy_card, height=8, bg="#ffffff").pack()

tk.Button(left, text="Calculate Purchase", command=calculate_shares,
          bg="#27ae60", fg="white", font=("Segoe UI", 10, "bold"), 
          cursor="hand2", relief="flat", pady=8).pack(pady=8, fill="x")

result_frame = tk.Frame(left, bg="#ffffff", relief="solid", bd=1)
result_frame.pack_forget()

tk.Label(result_frame, text="Results", font=("Segoe UI", 9, "bold"), bg="#ffffff", fg="#7f8c8d").pack(pady=(8, 4))

info_grid = tk.Frame(result_frame, bg="#ffffff")
info_grid.pack(fill="x", padx=12, pady=8)

tk.Label(info_grid, text="Shares:", font=("Segoe UI", 9), bg="#ffffff", anchor="w").grid(row=0, column=0, sticky="w", pady=2)
shares_value = tk.Label(info_grid, text="0", font=("Segoe UI", 11, "bold"), bg="#ffffff", anchor="e")
shares_value.grid(row=0, column=1, sticky="e", pady=2)

tk.Label(info_grid, text="Total Cost:", font=("Segoe UI", 9), bg="#ffffff", anchor="w").grid(row=1, column=0, sticky="w", pady=2)
total_cost_value = tk.Label(info_grid, text="Rs. 0.00", font=("Segoe UI", 10), bg="#ffffff", anchor="e", fg="#2c3e50")
total_cost_value.grid(row=1, column=1, sticky="e", pady=2)

tk.Label(info_grid, text="Balance:", font=("Segoe UI", 9), bg="#ffffff", anchor="w").grid(row=2, column=0, sticky="w", pady=2)
balance_value = tk.Label(info_grid, text="Rs. 0.00", font=("Segoe UI", 10), bg="#ffffff", anchor="e", fg="#16a085")
balance_value.grid(row=2, column=1, sticky="e", pady=2)

info_grid.columnconfigure(1, weight=1)

tk.Frame(result_frame, height=8, bg="#ffffff").pack()

# ---------- RIGHT: SELL & CASH OUT ----------
right = tk.Frame(main, bg="#ecf0f1")
right.pack(side="right", fill="both", expand=True, padx=8)

tk.Label(right, text="💸 Selling & Cash-Out", font=("Segoe UI", 12, "bold"), bg="#ecf0f1", fg="#2c3e50").pack(pady=(0, 8))

sell_card = tk.Frame(right, bg="#ffffff", relief="solid", bd=1)
sell_card.pack(fill="x")

sell_price_entry = labeled_entry(sell_card, "💸 Selling Price per Share (LKR)")
sell_shares_entry = labeled_entry(sell_card, "📦 Shares to Sell (default = all)")

tk.Frame(sell_card, height=4, bg="#ffffff").pack()

tk.Button(right, text="Calculate Profit", command=calculate_profit,
          bg="#e67e22", fg="white", font=("Segoe UI", 10, "bold"), 
          cursor="hand2", relief="flat", pady=8).pack(pady=8, fill="x")

cash_out_entry = labeled_entry(sell_card, "💵 Cash to Take Out (LKR)")

tk.Frame(sell_card, height=8, bg="#ffffff").pack()

tk.Button(right, text="Calculate Cash-Out", command=calculate_cash_out,
          bg="#9b59b6", fg="white", font=("Segoe UI", 10, "bold"), 
          cursor="hand2", relief="flat", pady=8).pack(pady=8, fill="x")

cash_result_frame = tk.Frame(right, bg="#fff3cd", relief="solid", bd=1)
cash_result_frame.pack_forget()

tk.Label(cash_result_frame, text="Shares Needed", font=("Segoe UI", 9), bg="#fff3cd", fg="#856404").pack(pady=(6, 2))
sell_shares_needed_value = tk.Label(cash_result_frame, text="0", font=("Segoe UI", 14, "bold"), bg="#fff3cd", fg="#856404")
sell_shares_needed_value.pack(pady=(0, 6))

profit_frame = tk.Frame(right, bg="#ffffff", relief="solid", bd=1)
profit_frame.pack_forget()

tk.Label(profit_frame, text="Profit Analysis", font=("Segoe UI", 9, "bold"), bg="#ffffff", fg="#7f8c8d").pack(pady=(8, 4))

profit_grid = tk.Frame(profit_frame, bg="#ffffff")
profit_grid.pack(fill="x", padx=12, pady=8)

tk.Label(profit_grid, text="Sell Total:", font=("Segoe UI", 9), bg="#ffffff", anchor="w").grid(row=0, column=0, sticky="w", pady=2)
sell_total_value = tk.Label(profit_grid, text="Rs. 0.00", font=("Segoe UI", 10), bg="#ffffff", anchor="e")
sell_total_value.grid(row=0, column=1, sticky="e", pady=2)

profit_label = tk.Label(profit_grid, text="", font=("Segoe UI", 9), bg="#ffffff", anchor="w")
profit_label.grid(row=1, column=0, sticky="w", pady=2)
profit_value = tk.Label(profit_grid, text="Rs. 0.00", font=("Segoe UI", 11, "bold"), bg="#ffffff", anchor="e")
profit_value.grid(row=1, column=1, sticky="e", pady=2)

tk.Label(profit_grid, text="ROI:", font=("Segoe UI", 9), bg="#ffffff", anchor="w").grid(row=2, column=0, sticky="w", pady=2)
roi_value = tk.Label(profit_grid, text="0.00%", font=("Segoe UI", 10), bg="#ffffff", anchor="e")
roi_value.grid(row=2, column=1, sticky="e", pady=2)

profit_grid.columnconfigure(1, weight=1)

tk.Frame(profit_frame, height=8, bg="#ffffff").pack()

copy_btn = tk.Button(root, text="📋 Copy Results", bg="#3498db", fg="white",
                     font=("Segoe UI", 10, "bold"), state="disabled",
                     cursor="hand2", relief="flat", pady=8)
copy_btn.pack(pady=(8, 12), padx=15, fill="x")

root.mainloop()