const API_BASE = "https://invest.bartleetreligare.com/atsweb";
let lastResults = [];       // For bid analysis
let lastFetchedRows = [];   // For fetchData tables

/* --------------------- Helpers --------------------- */
const $ = id => document.getElementById(id);

function normalizeSecurities(securities) {
    return Array.from(new Set(
        securities
            .map(s => (s || '').trim().toUpperCase().replace(/[^A-Z0-9\.]/g, ''))
            .filter(s => s && (s.endsWith('.N0000') || s.endsWith('.X0000')))
    ));
}

function safeJsonParse(text) {
    if (!text || !text.trim()) return null;
    try {
        // Replace single quotes around keys/strings with double quotes (best-effort)
        let jsonText = text.replace(/([{,])\s*'([^']+)'\s*:/g, '$1"$2":');
        jsonText = jsonText.replace(/:\s*'([^']*)'/g, ': "$1"');
        return JSON.parse(jsonText);
    } catch (err) {
        console.warn("JSON parse failed:", err);
        return null;
    }
}

async function apiFetchOrderBook(security) {
    const url = `${API_BASE}/marketdetails?action=getOrderBook&format=json&security=${encodeURIComponent(security)}&board=1`;
    try {
        const res = await fetch(url, {
            credentials: 'include',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Referer': `${API_BASE}/marketdetails`
            }
        });
        const text = await res.text();
        const data = safeJsonParse(text);
        return data?.data?.orderbook?.[0] || null;
    } catch (err) {
        console.error(`Fetch error for ${security}:`, err);
        return null;
    }
}

function formatNumber(n) {
    if (n == null || n === "" || isNaN(Number(n))) return String(n);
    return Number(n).toLocaleString();
}

function createTable(headers, rows) {
    const table = document.createElement('table');
    table.style.borderCollapse = "collapse";
    table.style.width = "100%";
    table.style.marginTop = "10px";

    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        th.style.border = "1px solid #ccc";
        th.style.padding = "6px 8px";
        th.style.backgroundColor = "#f7f7f7";
        th.style.textAlign = "left";
        th.style.fontSize = "13px";
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    rows.forEach(r => {
        const row = tbody.insertRow();
        r.forEach(cell => {
            const td = row.insertCell();
            td.textContent = (typeof cell === "number") ? formatNumber(cell) : cell;
            td.style.border = "1px solid #eee";
            td.style.padding = "6px 8px";
            td.style.fontSize = "13px";
        });
    });

    return table;
}

function setOutput(textOrNode) {
    const output = $("output");
    output.innerHTML = "";
    if (typeof textOrNode === "string") {
        output.textContent = textOrNode;
    } else if (textOrNode instanceof Node) {
        output.appendChild(textOrNode);
    }
}

/* --------------------- Fetch Data --------------------- */
async function fetchData(securities, filterTotals = false) {
    setOutput("Fetching...");
    const cleaned = normalizeSecurities(securities);

    if (cleaned.length === 0) {
        setOutput("⚠️ No valid securities provided.");
        return;
    }

    const rows = [];
    for (const sec of cleaned) {
        const orderbook = await apiFetchOrderBook(sec);
        if (!orderbook) {
            rows.push([sec, "⚠️ No orderbook data"]);
            continue;
        }

        if (filterTotals) {
            rows.push([sec, formatNumber(orderbook.totalask), formatNumber(orderbook.totalbids)]);
        } else {
            rows.push([sec, JSON.stringify(orderbook, null, 2)]);
        }
    }

    // Save for export
    lastFetchedRows = rows.map(r => (
        filterTotals
            ? { Security: r[0], "Total Ask": r[1], "Total Bids": r[2] }
            : { Security: r[0], Data: r[1] }
    ));

    // Display
    const headers = filterTotals ? ["Security", "Total Ask", "Total Bids"] : ["Security", "Data"];
    setOutput(createTable(headers, rows));
}

/* --------------------- Analyze Bid Dominance --------------------- */
async function analyzeBidDominance(securities) {
    setOutput("Analyzing Bid vs Ask...");
    const cleaned = normalizeSecurities(securities);
    const results = [];

    for (const sec of cleaned) {
        const ob = await apiFetchOrderBook(sec);
        if (!ob) continue;

        const totalAsk = parseFloat(ob.totalask);
        const totalBid = parseFloat(ob.totalbids);
        const bids = Array.isArray(ob.bid) ? ob.bid : [];
        const asks = Array.isArray(ob.ask) ? ob.ask : [];

        if (isNaN(totalAsk) || isNaN(totalBid) || bids.length === 0) continue;

        const totalBidSplits = bids.reduce((s, b) => s + (parseInt(b.splits || 0) || 0), 0);
        const totalAskSplits = asks.reduce((s, a) => s + (parseInt(a.splits || 0) || 0), 0);

        if (totalBid >= totalAsk) {
            const diffPercent = ((totalBid - totalAsk) / totalBid) * 100;
            const topBidEntry = bids.reduce((max, cur) => (parseFloat(cur.qty || 0) > parseFloat(max.qty || 0) ? cur : max), bids[0] || {});
            results.push({
                security: sec,
                totalAsk,
                totalBid,
                diffPercent,
                topBidPrice: topBidEntry.price || "N/A",
                topBidQty: topBidEntry.qty || 0,
                currentBidPrice: bids[0]?.price || "N/A",
                totalBidSplits,
                totalAskSplits
            });
        }
    }

    lastResults = results;
    results.sort((a, b) => (b.diffPercent - a.diffPercent) || (b.totalBidSplits - a.totalBidSplits));

    if (results.length === 0) {
        setOutput("⚠️ No companies found where bids ≥ asks.");
        return results;
    }

    const headers = [
        "#", "Security", "Bid Dominance (%)", "Total Bid Orders", "Total Ask Orders",
        "Total Bid", "Total Ask", "Top Bid Qty", "Top Bid Price", "Current Highest Bid"
    ];

    const rows = results.map((r, i) => [
        i + 1, r.security, r.diffPercent.toFixed(2), r.totalBidSplits,
        r.totalAskSplits, formatNumber(r.totalBid), formatNumber(r.totalAsk),
        formatNumber(r.topBidQty), r.topBidPrice, r.currentBidPrice
    ]);

    setOutput(createTable(headers, rows));
    return results;
}

/* --------------------- Watchlist --------------------- */
async function fetchWatchlist() {
    const secTextarea = $("securities");
    setOutput("Fetching watchlist...");

    try {
        const url = `${API_BASE}/watch?action=fullWatch&format=json&exchange=CSE&bookDefId=1&watchId=20906&lastUpdatedId=0`;
        const res = await fetch(url, {
            credentials: 'include',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Referer': `${API_BASE}/watch`
            }
        });
        const text = await res.text();
        const data = safeJsonParse(text);
        const securities = data?.data?.watch?.map(item => item.security) || [];
        const existing = secTextarea.value.split(',').map(s => s.trim()).filter(Boolean);
        const merged = Array.from(new Set([...existing, ...securities]));
        secTextarea.value = merged.join(',');
        setOutput(`Watchlist fetched: ${securities.length} securities added.`);
    } catch (err) {
        console.error("Watchlist fetch error:", err);
        setOutput(`Error fetching watchlist: ${err.message || err}`);
    }
}

/* --------------------- Export to Excel --------------------- */
function exportToExcel() {
    const dataToExport = lastResults.length ? lastResults : lastFetchedRows;
    if (!dataToExport || dataToExport.length === 0) {
        alert("No data to export!");
        return;
    }

    try {
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = lastResults.length ? "bid_vs_ask_analysis.xlsx" : "orderbook_data.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Export error:", err);
        alert("Failed to export: " + (err.message || err));
    }
}

async function sendToDatabase() {
    if (!lastResults || lastResults.length === 0) {
        alert("No analyzed data found. Please run the Bid vs Ask analysis first.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/store-bid-ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ records: lastResults }),
        });

        const result = await response.json();
        if (response.ok) {
            alert(`✅ ${result.inserted} records saved to the database successfully!`);
        } else {
            alert(`❌ Failed to save data: ${result.error}`);
        }
    } catch (err) {
        console.error("Error sending data:", err);
        alert("⚠️ Error connecting to the server. Make sure the API is running.");
    }
}


/* --------------------- Init & Event Wiring --------------------- */
function init() {
    $("fetchAllBtn").addEventListener('click', () => {
        const securities = $("securities").value.split(',').map(s => s.trim());
        fetchData(securities, false);
    });

    $("fetchTotalsBtn").addEventListener('click', () => {
        const securities = $("securities").value.split(',').map(s => s.trim());
        fetchData(securities, true);
    });

    $("fetchWatchlistBtn").addEventListener('click', fetchWatchlist);

    $("analyzeBidBtn").addEventListener('click', async () => {
        const securities = $("securities").value.split(',').map(s => s.trim());
        await analyzeBidDominance(securities);
    });

    $("exportBtn").addEventListener('click', exportToExcel);
    $("saveToDbBtn").addEventListener("click", sendToDatabase);

}

document.addEventListener('DOMContentLoaded', init);
