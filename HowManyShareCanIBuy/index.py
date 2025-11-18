import tkinter as tk
from tkinter import messagebox, ttk

# --- Variables to store calculated data ---
shares = 0
total_buy_cost = 0.0

def calculate_shares():
    global shares, total_buy_cost
    try:
        amount = float(amount_entry.get())
        price = float(price_entry.get())
        service_charge = float(charge_entry.get()) / 100

        shares = int(amount / (price * (1 + service_charge)))
        total_buy_cost = shares * price * (1 + service_charge)
        balance = amount - total_buy_cost

        # Update result cards
        shares_value.config(text=str(shares))
        total_cost_value.config(text=f"Rs. {total_buy_cost:,.2f}")
        balance_value.config(text=f"Rs. {balance:,.2f}")
        
        result_frame.pack(fill="both", expand=True, padx=15, pady=10)
        copy_btn.config(state="normal")

    except ValueError:
        messagebox.showerror("Invalid Input", "Please enter valid numbers.")
        result_frame.pack_forget()
        copy_btn.config(state="disabled")

def calculate_profit():
    global shares, total_buy_cost
    try:
        if shares == 0:
            messagebox.showwarning("No Purchase", "Please calculate your purchase first.")
            return

        sell_price = float(sell_price_entry.get())
        sell_commission = 0.0112
        total_sell = shares * sell_price * (1 - sell_commission)

        profit = total_sell - total_buy_cost
        roi = (profit / total_buy_cost) * 100

        status = "Profit" if profit >= 0 else "Loss"
        color = "#27ae60" if profit >= 0 else "#e74c3c"
        icon = "📈" if profit >= 0 else "📉"

        # Update profit display
        sell_total_value.config(text=f"Rs. {total_sell:,.2f}")
        profit_value.config(text=f"Rs. {abs(profit):,.2f}", fg=color)
        profit_label_text.config(text=f"{icon} Net {status}", fg=color)
        roi_value.config(text=f"{roi:+.2f}%", fg=color)
        
        profit_display_frame.pack(fill="both", expand=True, pady=10)

    except ValueError:
        messagebox.showerror("Invalid Input", "Please enter a valid selling price.")
        profit_display_frame.pack_forget()

def copy_result():
    result_text = (
        f"🧾 Purchase Summary\n"
        f"Shares: {shares}\n"
        f"Total Cost: Rs. {total_buy_cost:,.2f}\n"
    )
    
    profit_text = profit_label_text.cget("text")
    if profit_text:
        result_text += (
            f"\n💰 Selling Summary\n"
            f"Total Selling: {sell_total_value.cget('text')}\n"
            f"{profit_text}: {profit_value.cget('text')}\n"
            f"ROI: {roi_value.cget('text')}"
        )
    
    root.clipboard_clear()
    root.clipboard_append(result_text)
    messagebox.showinfo("Copied", "Results copied to clipboard!")

def create_card(parent, bg_color):
    card = tk.Frame(parent, bg=bg_color, relief="flat", bd=0)
    card.pack_configure(padx=10)  # Add horizontal padding to all cards
    return card

def create_input_field(parent, row, label_text, default_value=""):
    tk.Label(parent, text=label_text, font=("Segoe UI", 10, "bold"), 
             bg="#f8f9fa", fg="#2c3e50", anchor="w").grid(row=row, column=0, sticky="w", padx=15, pady=(12, 4))
    entry = tk.Entry(parent, font=("Segoe UI", 11), relief="solid", bd=1, 
                     bg="white", fg="#2c3e50", insertbackground="#3498db")
    entry.grid(row=row, column=1, sticky="ew", padx=15, pady=(0, 8), ipady=8)
    if default_value:
        entry.insert(0, default_value)
    return entry

def _on_mousewheel(event, canvas):
    # Identify which canvas triggered the event
    widget = event.widget
    while widget is not None:
        if widget in (left_canvas, right_canvas):
            canvas = widget
            break
        widget = widget.master
    
    if canvas:
        canvas.yview_scroll(int(-1*(event.delta/120)), "units")

# --- GUI setup ---
root = tk.Tk()
root.title("Stock Calculator")
root.geometry("1000x800")  # Slightly taller window
root.minsize(800, 600)     # Set minimum window size
root.configure(bg="#ecf0f1")

# Header
header = tk.Frame(root, bg="#3498db", height=70)
header.pack(fill="x")
header.pack_propagate(False)

tk.Label(header, text="📊 Stock Profit & ROI Calculator", 
         font=("Segoe UI", 18, "bold"), bg="#3498db", fg="white").pack(pady=20)

# Main container for side-by-side layout
main_container = tk.Frame(root, bg="#ecf0f1")
main_container.pack(fill="both", expand=True, padx=20, pady=(10, 20))

# ============= LEFT SIDE: PURCHASE CALCULATOR =============
left_frame = tk.Frame(main_container, bg="#ecf0f1")
left_frame.pack(side="left", fill="both", expand=True, padx=(0, 5))

# Canvas and Scrollbar for left side
left_canvas = tk.Canvas(left_frame, bg="#ecf0f1", highlightthickness=0)
left_scrollbar = ttk.Scrollbar(left_frame, orient="vertical", command=left_canvas.yview)
left_scrollable = tk.Frame(left_canvas, bg="#ecf0f1")

left_scrollable.bind(
    "<Configure>",
    lambda e: left_canvas.configure(scrollregion=left_canvas.bbox("all"))
)

left_canvas.create_window((0, 0), window=left_scrollable, anchor="nw", width=460)  # Fixed width
left_canvas.configure(yscrollcommand=left_scrollbar.set)

left_canvas.pack(side="left", fill="both", expand=True)
left_scrollbar.pack(side="right", fill="y")

# Bind mousewheel only to this canvas
left_canvas.bind("<Enter>", lambda e: left_canvas.bind_all("<MouseWheel>", lambda e: _on_mousewheel(e, left_canvas)))
left_canvas.bind("<Leave>", lambda e: left_canvas.unbind_all("<MouseWheel>"))

# Left Header
tk.Label(left_scrollable, text="💰 Purchase Calculator", 
         font=("Segoe UI", 15, "bold"), bg="#ecf0f1", fg="#2c3e50").pack(pady=(10, 15))

# Input Section
input_card = create_card(left_scrollable, "#f8f9fa")
input_card.pack(fill="x", padx=15, pady=10)

input_frame = tk.Frame(input_card, bg="#f8f9fa")
input_frame.pack(fill="x", pady=15)
input_frame.columnconfigure(1, weight=1)

amount_entry = create_input_field(input_frame, 0, "💵 Total Money (LKR)")
price_entry = create_input_field(input_frame, 1, "💰 Share Price (LKR)")
charge_entry = create_input_field(input_frame, 2, "📊 Service Charge (%)", "1.12")

# Button Frame
btn_frame = tk.Frame(left_scrollable, bg="#ecf0f1")
btn_frame.pack(pady=15)

calc_btn = tk.Button(btn_frame, text="Calculate Purchase", command=calculate_shares, 
                     font=("Segoe UI", 11, "bold"), bg="#27ae60", fg="white", 
                     relief="flat", cursor="hand2", padx=25, pady=12, activebackground="#229954")
calc_btn.pack()

# Result Section
result_frame = create_card(left_scrollable, "#ffffff")

tk.Label(result_frame, text="Purchase Summary", font=("Segoe UI", 13, "bold"), 
         bg="#ffffff", fg="#2c3e50").pack(pady=(15, 10))

result_grid = tk.Frame(result_frame, bg="#ffffff")
result_grid.pack(fill="x", padx=15, pady=10)

# Shares
shares_card = tk.Frame(result_grid, bg="#ecf0f1", relief="flat")
shares_card.pack(fill="x", pady=5)
tk.Label(shares_card, text="Shares Purchased", font=("Segoe UI", 9), bg="#ecf0f1", fg="#7f8c8d").pack(pady=(10, 0))
shares_value = tk.Label(shares_card, text="0", font=("Segoe UI", 18, "bold"), bg="#ecf0f1", fg="#2c3e50")
shares_value.pack(pady=(5, 10))

# Total Cost
cost_card = tk.Frame(result_grid, bg="#ecf0f1", relief="flat")
cost_card.pack(fill="x", pady=5)
tk.Label(cost_card, text="Total Cost (incl. charges)", font=("Segoe UI", 9), bg="#ecf0f1", fg="#7f8c8d").pack(pady=(10, 0))
total_cost_value = tk.Label(cost_card, text="Rs. 0.00", font=("Segoe UI", 16, "bold"), bg="#ecf0f1", fg="#2c3e50")
total_cost_value.pack(pady=(5, 10))

# Balance
balance_card = tk.Frame(result_grid, bg="#ecf0f1", relief="flat")
balance_card.pack(fill="x", pady=5)
tk.Label(balance_card, text="Remaining Balance", font=("Segoe UI", 9), bg="#ecf0f1", fg="#7f8c8d").pack(pady=(10, 0))
balance_value = tk.Label(balance_card, text="Rs. 0.00", font=("Segoe UI", 16, "bold"), bg="#ecf0f1", fg="#2c3e50")
balance_value.pack(pady=(5, 10))

tk.Label(result_frame, text="", bg="#ffffff").pack(pady=10)

# ============= RIGHT SIDE: SELLING CALCULATOR =============
right_frame = tk.Frame(main_container, bg="#ecf0f1")
right_frame.pack(side="right", fill="both", expand=True, padx=(5, 0))

# Canvas and Scrollbar for right side
right_canvas = tk.Canvas(right_frame, bg="#ecf0f1", highlightthickness=0)
right_scrollbar = ttk.Scrollbar(right_frame, orient="vertical", command=right_canvas.yview)
right_scrollable = tk.Frame(right_canvas, bg="#ecf0f1")

right_scrollable.bind(
    "<Configure>",
    lambda e: right_canvas.configure(scrollregion=right_canvas.bbox("all"))
)

right_canvas.create_window((0, 0), window=right_scrollable, anchor="nw", width=460)  # Fixed width
right_canvas.configure(yscrollcommand=right_scrollbar.set)

right_canvas.pack(side="left", fill="both", expand=True)
right_scrollbar.pack(side="right", fill="y")

# Bind mousewheel only to this canvas
right_canvas.bind("<Enter>", lambda e: right_canvas.bind_all("<MouseWheel>", lambda e: _on_mousewheel(e, right_canvas)))
right_canvas.bind("<Leave>", lambda e: right_canvas.unbind_all("<MouseWheel>"))

# Right Header
tk.Label(right_scrollable, text="💸 Selling Calculator", 
         font=("Segoe UI", 15, "bold"), bg="#ecf0f1", fg="#2c3e50").pack(pady=(10, 15))

# Selling Section
sell_section_frame = create_card(right_scrollable, "#f8f9fa")
sell_section_frame.pack(fill="x", padx=15, pady=10)

tk.Label(sell_section_frame, text="Enter Selling Details", 
         font=("Segoe UI", 12, "bold"), bg="#f8f9fa", fg="#2c3e50").pack(pady=(15, 10))

sell_input_frame = tk.Frame(sell_section_frame, bg="#f8f9fa")
sell_input_frame.pack(pady=10, padx=15)

tk.Label(sell_input_frame, text="💸 Selling Price per Share (LKR)", 
         font=("Segoe UI", 10), bg="#f8f9fa", fg="#2c3e50").pack(pady=(0, 5), anchor="w")
sell_price_entry = tk.Entry(sell_input_frame, font=("Segoe UI", 11), relief="solid", 
                            bd=1, bg="white", fg="#2c3e50", insertbackground="#3498db")
sell_price_entry.pack(fill="x", ipady=6)

tk.Label(sell_input_frame, text="(Commission: 1.12% will be deducted)", 
         font=("Segoe UI", 8), bg="#f8f9fa", fg="#7f8c8d").pack(pady=(5, 0))

calc_profit_btn = tk.Button(sell_section_frame, text="Calculate Profit & ROI", command=calculate_profit, 
          font=("Segoe UI", 11, "bold"), bg="#e67e22", fg="white", 
          relief="flat", cursor="hand2", padx=25, pady=12, activebackground="#d35400")
calc_profit_btn.pack(pady=15)

tk.Label(sell_section_frame, text="", bg="#f8f9fa").pack(pady=5)

# Profit Display
profit_display_frame = tk.Frame(right_scrollable, bg="#ffffff", relief="flat")

tk.Label(profit_display_frame, text="Selling Summary", font=("Segoe UI", 13, "bold"), 
         bg="#ffffff", fg="#2c3e50").pack(pady=(15, 10))

profit_grid = tk.Frame(profit_display_frame, bg="#ffffff")
profit_grid.pack(fill="x", padx=15, pady=10)

# Selling Total
sell_card = tk.Frame(profit_grid, bg="#ecf0f1", relief="flat")
sell_card.pack(fill="x", pady=5)
tk.Label(sell_card, text="Total Selling (after commission)", font=("Segoe UI", 9), bg="#ecf0f1", fg="#7f8c8d").pack(pady=(10, 0))
sell_total_value = tk.Label(sell_card, text="Rs. 0.00", font=("Segoe UI", 16, "bold"), bg="#ecf0f1", fg="#2c3e50")
sell_total_value.pack(pady=(5, 10))

# Profit/Loss
profit_card = tk.Frame(profit_grid, bg="#ecf0f1", relief="flat")
profit_card.pack(fill="x", pady=5)
profit_label_text = tk.Label(profit_card, text="Net Profit", font=("Segoe UI", 9), bg="#ecf0f1", fg="#7f8c8d")
profit_label_text.pack(pady=(10, 0))
profit_value = tk.Label(profit_card, text="Rs. 0.00", font=("Segoe UI", 18, "bold"), bg="#ecf0f1", fg="#27ae60")
profit_value.pack(pady=(5, 10))

# ROI
roi_card = tk.Frame(profit_grid, bg="#ecf0f1", relief="flat")
roi_card.pack(fill="x", pady=5)
tk.Label(roi_card, text="Return on Investment (ROI)", font=("Segoe UI", 9), bg="#ecf0f1", fg="#7f8c8d").pack(pady=(10, 0))
roi_value = tk.Label(roi_card, text="0.00%", font=("Segoe UI", 16, "bold"), bg="#ecf0f1", fg="#2c3e50")
roi_value.pack(pady=(5, 10))

tk.Label(profit_display_frame, text="", bg="#ffffff").pack(pady=10)

# Copy button at the bottom
copy_frame = tk.Frame(root, bg="#ecf0f1")
copy_frame.pack(side="bottom", pady=10)

copy_btn = tk.Button(copy_frame, text="📋 Copy All Results", command=copy_result, 
                     font=("Segoe UI", 11, "bold"), bg="#3498db", fg="white", 
                     relief="flat", cursor="hand2", padx=30, pady=12, state="disabled", activebackground="#2980b9")
copy_btn.pack()

root.mainloop()