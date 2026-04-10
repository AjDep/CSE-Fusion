import requests

# Paste your WORKING URL here (the one that returns data)
URL = "https://script.google.com/macros/s/AKfycbyzf4F4HUu5GoAuZwkwDGO15splf4pYZYzEOVOONTc3ByNbPb_7RWAETWV6CS6cf_bpLw/exec"

def get_data():
    print("Fetching data from Google Sheets...")

    response = requests.get(URL)
    data = response.text

    lines = data.strip().split("\n")

    temps = []
    timestamps = []

    for i, line in enumerate(lines):
        parts = line.split(",")

        if len(parts) >= 2:
            temp = float(parts[0])
            temps.append(temp)

            # fake timestamp (just index)
            timestamps.append(i)

    return temps, timestamps


def analyze(temps, timestamps):
    max_temp = max(temps)
    min_temp = min(temps)
    avg_temp = sum(temps) / len(temps)

    max_index = temps.index(max_temp)
    min_index = temps.index(min_temp)

    print("\n===== RESULTS =====")
    print("Max Temp: {:.2f} C at time {}".format(max_temp, timestamps[max_index]))
    print("Min Temp: {:.2f} C at time {}".format(min_temp, timestamps[min_index]))
    print("Average Temp: {:.2f} C".format(avg_temp))


temps, timestamps = get_data()
analyze(temps, timestamps)
