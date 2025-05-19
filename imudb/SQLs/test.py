import json
from bs4 import BeautifulSoup
import re

def extract_floorsheet_data(html_content):
    """
    Extracts floorsheet data (buyers and sellers) from the embedded JSON
    in the data-page attribute of the HTML content.
    """
    soup = BeautifulSoup(html_content, 'html.parser')

    # Find the element containing the data-page attribute
    # This div holds the JSON data used by the frontend component
    data_div = soup.find('div', {'data-page': True})

    if not data_div:
        print("Error: Could not find the data div with 'data-page' attribute.")
        return None, None

    # Extract the value of the data-page attribute (which is a JSON string)
    page_data_json_string = data_div['data-page']

    # The JSON string contains escaped quotes and HTML tags, need to parse and clean
    try:
        # Parse the JSON string
        page_data = json.loads(page_data_json_string)

        # Access the relevant data structures
        stock_buyers = page_data.get('stockWiseBuyer')
        stock_sellers = page_data.get('stockWiseSeller')

        return stock_buyers, stock_sellers

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON data: {e}")
        return None, None
    except KeyError as e:
        print(f"Error accessing data key: {e}. The JSON structure might have changed.")
        return None, None
    except Exception as e:
        print(f"An unexpected error occurred during data extraction: {e}")
        return None, None


def format_broker_list(broker_list):
    """
    Formats a list of broker entries into a readable string format.
    """
    formatted = []
    for broker_entry in broker_list:
        # Use .get() with a default to handle potentially missing keys gracefully
        broker_num = broker_entry.get('broker', '-')
        qty = broker_entry.get('qty', '-')
        percent_html = broker_entry.get('percent', '-')

        # Clean up the percentage string (remove HTML tags like <b>)
        if isinstance(percent_html, str):
             percent = re.sub(r'<[^>]+>', '', percent_html).strip() # Remove HTML tags
        else:
             percent = str(percent_html) # Ensure it's a string if it's not already

        # Handle cases where quantity or percentage might be empty strings or represented by '-'
        if broker_num == '': broker_num = '-'
        if qty == '': qty = '-'
        if percent == '': percent = '-'


        # Example format: "  Broker 26: 200 kitta (66.67 %)"
        formatted.append(f"  Broker {broker_num}: {qty} Kitta ({percent})")
    return "\n".join(formatted)

# --- Main Execution ---
file_path = 'floorsheet-analysis.txt'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
except FileNotFoundError:
    print(f"Error: File not found at {file_path}")
    exit()
except Exception as e:
    print(f"Error reading file {file_path}: {e}")
    exit()

buyers_data, sellers_data = extract_floorsheet_data(html_content)

if buyers_data is not None:
    print("--- Stock Wise Top Buyers ---")
    # Iterate through the dictionary of stocks and their top buyers
    for symbol, brokers in buyers_data.items():
        print(f"\nStock Symbol: {symbol}")
        if brokers:
            print(format_broker_list(brokers))
        else:
            print("  No top buyers data available for this stock.")

if sellers_data is not None:
    print("\n--- Stock Wise Top Sellers ---")
    # Iterate through the dictionary of stocks and their top sellers
    for symbol, brokers in sellers_data.items():
        print(f"\nStock Symbol: {symbol}")
        if brokers:
            print(format_broker_list(brokers))
        else:
            print("  No top sellers data available for this stock.")

print("\n--- Extraction Complete ---")

