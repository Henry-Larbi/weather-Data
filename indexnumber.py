import os
import pandas as pd
import datetime
import sys
import random
import urllib.request
import io
from typing import List, Dict, Union

# Constants
E_LEVY = 0.01
SERVICE_CHARGE_TELESTAR = 0.005
SERVICE_CHARGE_OTHER = 0.0075
CASHOUT_FEE = 0.05
PROCESSING_FEE = 0.75
DATA_SHARE_FEE = 0.5
LOAN_LIMIT = 1000.00
LOAN_RATE = 0.22
INITIAL_BALANCE = 1000.00
DEFAULT_PIN = "7209"

# ── Cloud Storage URLs ────────────────────────────────────────────────
PHONE_URL    = "https://drive.google.com/uc?export=download&id=1-8qY-mUdGJsq74qeVbaUrEUxKLm02Jy0"
MERCHANT_URL = "https://drive.google.com/uc?export=download&id=1m7hqDeJ1ONnEz3cJ225PYB6YHop1hMPj"
METER_URL    = "https://drive.google.com/uc?export=download&id=1JMXmqsSq5vlVvLaqDKWiZ96_E5xbRGlO"
DSTV_URL     = "https://drive.google.com/uc?export=download&id=1aTtQ-idNfsOQoIIjBxePZ8gDAEOQ_W95"
CASHOUT_URL  = "https://drive.google.com/uc?export=download&id=1HGRqv_DhE2T9_yIE9IX8zgJriwfgG15X"


def _load_cloud_csv(url: str, dtype=None) -> pd.DataFrame:
    with urllib.request.urlopen(url) as response:
        raw = response.read().decode("utf-8")
    return pd.read_csv(io.StringIO(raw), dtype=dtype)


# ── Load customer data ────────────────────────────────────────────────
try:
    telestar_customer_list = _load_cloud_csv(PHONE_URL, dtype=str)
    telestar_customer_list.columns = ["Phone Number", "Name of Customer"]
    telestar_user_dict = telestar_customer_list.to_dict(orient="records")
    registered_customers = [str(user["Phone Number"]) for user in telestar_user_dict]
except Exception as e:
    print(f"Error: Customer data could not be loaded from cloud. ({e})")
    telestar_user_dict = []
    registered_customers = []

# ── Load merchant data ────────────────────────────────────────────────
try:
    merchant_sheet = _load_cloud_csv(MERCHANT_URL)
    merchant_sheet.columns = ["Vendor ID", "Vendor Name"]
    merchant_dict = merchant_sheet.to_dict(orient="records")
    registered_merchant = [merchant["Vendor ID"] for merchant in merchant_dict]
except Exception as e:
    print(f"Error: Merchant data could not be loaded from cloud. ({e})")
    merchant_dict = []
    registered_merchant = []

# ── Load meter, DSTV, and cashout data ───────────────────────────────
try:
    meter_sheet = _load_cloud_csv(METER_URL)
    meter_dict = meter_sheet.to_dict(orient="records")
    registered_meters = [str(list(m.values())[0]) for m in meter_dict]
except Exception as e:
    print(f"Error: Meter data could not be loaded from cloud. ({e})")
    meter_dict = []
    registered_meters = []

try:
    dstv_sheet = _load_cloud_csv(DSTV_URL)
    dstv_dict = dstv_sheet.to_dict(orient="records")
    registered_iuc = [str(list(d.values())[0]) for d in dstv_dict]
except Exception as e:
    print(f"Error: DSTV data could not be loaded from cloud. ({e})")
    dstv_dict = []
    registered_iuc = []

try:
    cashout_sheet = _load_cloud_csv(CASHOUT_URL)
    cashout_merchant_dict = cashout_sheet.to_dict(orient="records")
except Exception as e:
    print(f"Error: Cashout merchant data could not be loaded from cloud. ({e})")
    cashout_merchant_dict = []

history: List[Dict[str, Union[str, float]]] = []
loan_balance = 0.0
loan_taken_time = None


def record_transaction(transaction_type: str, amount: float, charges: float,
                       recipient: str, status: str, balance_after: float) -> Dict[str, Union[str, float]]:
    transaction = {
        "txn_id": generate_transaction_id(),
        "time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "type": transaction_type,
        "amount": amount,
        "charges": charges if charges is not None else 0.00,
        "recipient": recipient,
        "balance_after": balance_after,
        "status": status
    }
    history.append(transaction)
    return transaction


def display_transaction(transaction: Dict[str, Union[str, float]]) -> str:
    return (
        f"\n--- Record ---\n"
        f"Txn ID        : {transaction['txn_id']}\n"
        f"Time          : {transaction['time']}\n"
        f"Type          : {transaction['type']}\n"
        f"Amount (GHS)  : {transaction['amount']:.2f}\n"
        f"Charges (GHS) : {transaction['charges']:.2f}\n"
        f"Recipient     : {transaction['recipient']}\n"
        f"Balance After : {transaction['balance_after']:.2f}\n"
        f"Status        : {transaction['status']}\n"
        f"---------------------------\n"
    )


def generate_transaction_id() -> str:
    return str(random.randint(10000000000, 99999999999))


def log_transaction(transaction: Dict[str, Union[str, float]]) -> None:
    import csv
    fieldnames = ["txn_id", "time", "type", "amount", "charges", "recipient", "balance_after", "status"]
    file_exists = os.path.exists("transaction_log.csv")
    with open("transaction_log.csv", "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow(transaction)


def validate_pin(input_pin: str, correct_pin: str, max_attempts: int = 3) -> bool:
    attempts = 0
    while attempts < max_attempts:
        if input_pin == correct_pin:
            return True
        attempts += 1
        if attempts < max_attempts:
            print(f"Invalid PIN! {max_attempts - attempts} attempts remaining.")
            input_pin = input("Enter PIN: ")
    print("Too many wrong attempts! Your PIN has been suspended.")
    sys.exit()


def get_valid_amount(prompt: str, max_amount: float = float('inf')) -> float:
    while True:
        try:
            amount = float(input(prompt))
            if amount <= 0:
                print("Amount must be positive.")
            elif amount > max_amount:
                print(f"Amount exceeds available balance of GHS {max_amount:.2f}")
            else:
                return amount
        except ValueError:
            print("Invalid amount. Please enter a number.")


def main_display():
    print("\nWelcome to Telestar Mobile Money! Please select an option:")
    print("1. Transfer Money")
    print("2. MOMO Pay")
    print("3. Airtime and Bundles")
    print("4. Allow Cash Out")
    print("5. Financial Services")
    print("6. My Wallet")
    choice = input("Please select an option (1-6): ")
    return choice


# ─────────────────────────── TRANSFER MONEY ───────────────────────────

class Transfer_money():
    def __init__(self, current_balance: float, momopin: str):
        self.amount = current_balance
        self.pin = momopin
        self.recipient_number = ""
        self.recipient_name = ""

    def prompt(self):
        print("\nTransfer Money:")
        print("1. TeleStar Network")
        print("2. Other Networks")

    def TeleStar_Network(self, choice: int) -> bool:
        if choice == 1:
            return True
        else:
            return False

    def Number(self, number: str) -> tuple:
        if number[:3] == "059" and len(number) == 11:
            for user in telestar_user_dict:
                if user["Phone Number"] == number:
                    self.recipient_name = user["Name of Customer"]
                    self.recipient_number = number
                    return True, number
            return False, None
        else:
            return False, None

    def charges(self, amount: float, telestar: bool) -> tuple:
        service = round(amount * SERVICE_CHARGE_TELESTAR, 2) if telestar else round(amount * SERVICE_CHARGE_OTHER, 2)
        charge = round(amount * E_LEVY, 2)
        total_charge = round(service + charge, 2)
        return total_charge, service, charge

    def Transfer_amount(self, amount: float, total_charge: float) -> tuple:
        if amount + total_charge <= self.amount:
            self.amount = round(self.amount - (amount + total_charge), 2)
            return self.amount, True
        else:
            return self.amount, False

    def message(self, amount: float, service: float, charge: float):
        print(f"GHS {amount:.2f} has been sent successfully to {self.recipient_name}")
        print(f"E-levy charge: GHS {charge:.2f}")
        print(f"Service charge: GHS {service:.2f}")
        print(f"New balance: GHS {self.amount:.2f}")


def transfer_money(current_balance, MOMO_pin):
    startup = Transfer_money(current_balance, MOMO_pin)
    startup.prompt()

    while True:
        choice = input("Enter your transfer choice (1/2): ")
        try:
            if int(choice) in [1, 2]:
                break
        except ValueError:
            pass
        print("Invalid choice")

    is_telestar = startup.TeleStar_Network(int(choice))

    if is_telestar:
        while True:
            choice_2 = input("Enter recipient TeleStar phone number (should start with 059): ")
            next_choice_2, recipient_number = startup.Number(choice_2)
            if next_choice_2:
                break
            else:
                print("Invalid TeleStar number. Try again.")

        while True:
            choice_3 = input("Verify the phone number by entering it again: ")
            if choice_3 == recipient_number:
                break
            else:
                print("Phone number mismatch. Please try again.")

        transfer_amount = get_valid_amount("Enter the amount to transfer: ")
        total_charge, service, charge = startup.charges(transfer_amount, True)

        while transfer_amount + total_charge > startup.amount:
            print(f"Insufficient balance! Total required: GHS {transfer_amount + total_charge:.2f}")
            transfer_amount = get_valid_amount("Enter new amount to transfer: ")
            total_charge, service, charge = startup.charges(transfer_amount, True)

        pin_input = input(f"Enter your MOMO PIN to authorize transfer to {startup.recipient_name}: ")
        validate_pin(pin_input, MOMO_pin)

        new_balance, confirm = startup.Transfer_amount(transfer_amount, total_charge)
        if confirm:
            startup.message(transfer_amount, service, charge)
            txn = record_transaction("Transfer", transfer_amount, total_charge, startup.recipient_name, "Successful", startup.amount)
            log_transaction(txn)
            current_balance = startup.amount

    else:
        while True:
            recipient = input("Enter recipient phone number (050/026/023): ")
            if len(recipient) == 10 and recipient[:3] in ["050", "026", "023"] and recipient.isdigit():
                break
            print("Invalid phone number. Try again.")

        transfer_amount = get_valid_amount("Enter the amount to transfer: ")
        total_charge, service, charge = startup.charges(transfer_amount, False)

        while transfer_amount + total_charge > startup.amount:
            print(f"Insufficient balance! Total required: GHS {transfer_amount + total_charge:.2f}")
            transfer_amount = get_valid_amount("Enter new amount to transfer: ")
            total_charge, service, charge = startup.charges(transfer_amount, False)

        pin_input = input("Enter your MOMO PIN to authorize transfer: ")
        validate_pin(pin_input, MOMO_pin)

        startup.recipient_name = recipient
        new_balance, confirm = startup.Transfer_amount(transfer_amount, total_charge)
        if confirm:
            startup.message(transfer_amount, service, charge)
            txn = record_transaction("Transfer", transfer_amount, total_charge, recipient, "Successful", startup.amount)
            log_transaction(txn)
            current_balance = startup.amount

    return current_balance


# ─────────────────────────── MOMO PAY ────────────────────────────────

def generate_ecg_token() -> str:
    # Appendix: 20-digit ECG token built from 5 blocks
    block1 = random.randint(1000, 9999)              # Base
    block2 = int(str(block1)[::-1])                   # Mirror (reversed base)
    block3 = 9999 - block1                            # Complement
    block4 = sum(int(d) for d in str(block1)) * 111   # Checksum
    block5 = (block1 * block2) % 10000                # Scaler
    return f"{block1} {block2} {block3} {block4} {block5}"


class MomoPay():
    def __init__(self, current_balance: float, momopin: str):
        self.amount = current_balance
        self.pin = momopin
        self.merchant_name = ""
        self.merchant_id = ""

    def find_merchant(self, merchant_id) -> bool:
        for merchant in merchant_dict:
            if merchant["Vendor ID"] == merchant_id:
                self.merchant_name = merchant["Vendor Name"]
                self.merchant_id = merchant_id
                return True
        return False

    def pay_merchant(self, amount: float) -> tuple:
        # MomoPay: E-levy only, no service charge
        elevy = round(amount * E_LEVY, 2)
        total = round(amount + elevy, 2)
        if total <= self.amount:
            self.amount = round(self.amount - total, 2)
            return True, elevy
        return False, elevy

    def pay_bill(self, amount: float) -> bool:
        # ECG / DSTV: flat processing fee, no E-levy
        total = round(amount + PROCESSING_FEE, 2)
        if total <= self.amount:
            self.amount = round(self.amount - total, 2)
            return True
        return False


def momopay_paybill(current_balance, MOMO_pin):
    pay = MomoPay(current_balance, MOMO_pin)

    print("\nMomoPay/Paybill:")
    print("- Momopay")
    print("- Paybill")

    while True:
        choice = input("Enter your choice: ")
        if choice in ["1", "2"]:
            break
        print("Invalid choice.")

    # ─────────────── MOMOPAY (no service charge, no PIN) ───────────────
    if choice == "1":
        while True:
            try:
                merchant_id = int(input("Enter the 6-digit Merchant ID: "))
                if pay.find_merchant(merchant_id):
                    break
                print("Merchant not found. Try again.")
            except ValueError:
                print("Invalid Merchant ID.")

        print(f"Proceed to make payment to merchant, {pay.merchant_name}")
        amount = get_valid_amount("Enter the amount to pay: ", pay.amount)

        success, elevy = pay.pay_merchant(amount)
        if success:
            print(f"GHS {amount} has been paid successfully to {pay.merchant_name}, "
                  f"with E-levy charge of GHS {elevy}.")
            print(f"New balance: GHS {pay.amount}")
            txn = record_transaction("MoMoPay", amount, elevy, pay.merchant_name, "Successful", pay.amount)
            log_transaction(txn)
        else:
            print("Insufficient balance.")

    # ─────────────────────────── PAYBILL ──────────────────────────────
    elif choice == "2":
        print("- ECG (Electricity)")
        print("- DSTV")

        while True:
            bill_choice = input("Enter your choice: ")
            if bill_choice in ["1", "2"]:
                break
            print("Invalid choice.")

        # ----- ECG (Electricity) -----
        if bill_choice == "1":
            while True:
                meter_number = input("Enter your ECG Meter number to proceed: ")
                if meter_number in registered_meters:
                    break
                print("Invalid meter number. Try again.")

            amount = get_valid_amount("Enter the amount to pay: ", pay.amount)
            print(f"You are paying GHS {amount:.2f} for ECG Meter: {meter_number}")
            print(f"Processing fee : GHS {PROCESSING_FEE}")
            print(f"Total amount : GHS {amount + PROCESSING_FEE:.2f}")

            pin_input = input("Enter your 4-digit PIN: ")
            validate_pin(pin_input, MOMO_pin)

            if pay.pay_bill(amount):
                token = generate_ecg_token()
                print(f"Payment of GHS {amount:.2f} to ECG successful.")
                print(f"Your token is: {token}")
                print(f"New balance: GHS {pay.amount:.2f}")
                txn = record_transaction("ECG PayBill", amount, PROCESSING_FEE, meter_number, "Successful", pay.amount)
                log_transaction(txn)
            else:
                print("Insufficient balance.")

        # ----- DSTV -----
        elif bill_choice == "2":
            while True:
                iuc_number = input("Enter IUC Number: ")
                if iuc_number in registered_iuc:
                    break
                print("Invalid IUC number. Try again.")

            iuc_index = registered_iuc.index(iuc_number)
            iuc_name = list(dstv_dict[iuc_index].values())[1]

            print("--------------DSTV PACKAGES--------------")
            print("- Compact - GHS 250.00")
            print("- Family - GHS 280.00")
            print("--------------------------------------------------")

            packages = {"1": (250.00, "Compact"), "2": (280.00, "Family")}
            while True:
                package_choice = input("Enter your package choice : ")
                if package_choice in ["1", "2"]:
                    break
                print("Invalid choice.")

            price, label = packages[package_choice]
            print(f"You are paying GHS {price:.2f} for {iuc_name} - {label}")
            print(f"Processing fee : GHS {PROCESSING_FEE}")
            print(f"Total amount : GHS {price + PROCESSING_FEE:.2f}")

            pin_input = input("Enter your 4-digit PIN: ")
            validate_pin(pin_input, MOMO_pin)

            if pay.pay_bill(price):
                print(f"Payment of GHS {price:.2f} to DSTV successful.")
                print(f"New balance: GHS {pay.amount:.2f}")
                txn = record_transaction("DSTV PayBill", price, PROCESSING_FEE, iuc_name, "Successful", pay.amount)
                log_transaction(txn)
            else:
                print("Insufficient balance.")

    return pay.amount


# ─────────────────────────── AIRTIME AND BUNDLES ─────────────────────

class AirtimeAndBundles():
    def __init__(self, current_balance: float, data_balance: float, airtime_balance: float):
        self.amount = current_balance
        self.data_balance = data_balance
        self.airtime_balance = airtime_balance

    def buy_airtime(self, airtime_amount: float) -> bool:
        if airtime_amount <= self.amount:
            self.amount = round(self.amount - airtime_amount, 2)
            self.airtime_balance += airtime_amount
            return True
        return False

    def buy_bundle(self, bundle_price: float, data_mb: float) -> bool:
        if bundle_price <= self.amount:
            self.amount = round(self.amount - bundle_price, 2)
            self.data_balance = round(self.data_balance + data_mb, 2)
            return True
        return False

    def find_recipient(self, number: str):
        if number[:3] == "059" and len(number) == 11:
            for user in telestar_user_dict:
                if user["Phone Number"] == number:
                    return user["Name of Customer"]
        return None

    def share_data(self, mb_to_share: float) -> bool:
        # Bundle must be greater than amount shared, and cash must cover the fee
        if self.data_balance > mb_to_share and self.amount > DATA_SHARE_FEE:
            self.data_balance = round(self.data_balance - mb_to_share, 2)
            self.amount = round(self.amount - DATA_SHARE_FEE, 2)
            return True
        return False


def airtime_bundle(current_balance, data_balance, airtime_balance):
    ab = AirtimeAndBundles(current_balance, data_balance, airtime_balance)

    print("\nAirtime and Bundles:")
    print("1. Buy Airtime")
    print("2. Buy Bundles")
    print("3. Data Sharing")

    while True:
        choice = input("Enter your choice: ")
        if choice in ["1", "2", "3"]:
            break
        print("Invalid choice.")

    if choice == "1":
        airtime_amount = get_valid_amount("Enter amount to purchase: ", ab.amount)
        confirm = input(f"Purchase GHS {airtime_amount:.2f} airtime? 1.Yes 2.No: ")
        if confirm == "1":
            if ab.buy_airtime(airtime_amount):
                print(f"GHS {airtime_amount:.2f} airtime purchased. New balance: GHS {ab.amount:.2f}")
                txn = record_transaction("Airtime", airtime_amount, 0.0, "Self", "Successful", ab.amount)
                log_transaction(txn)
            else:
                print("Insufficient balance.")

    elif choice == "2":
        print("1. 280MB  - GHS 5")
        print("2. 667MB  - GHS 10")
        print("3. 10GB   - GHS 100")
        print("4. Flexi-Bundle")

        while True:
            bundle_choice = input("Choose (1-4): ")
            if bundle_choice in ["1", "2", "3", "4"]:
                break
            print("Invalid choice.")

        if bundle_choice in ["1", "2", "3"]:
            bundles = {"1": (5, 280, "280MB"), "2": (10, 667, "667MB"), "3": (100, 10240, "10GB")}
            bundle_price, data_mb, label = bundles[bundle_choice]
            confirm = input(f"Buy {label} for GHS {bundle_price}? 1.Yes 2.No: ")
            if confirm == "1":
                if ab.buy_bundle(bundle_price, data_mb):
                    print(f"{label} bundle purchased. New balance: GHS {ab.amount:.2f}")
                    txn = record_transaction("Data Bundle", bundle_price, 0.0, "Self", "Successful", ab.amount)
                    log_transaction(txn)
                else:
                    print("Insufficient balance.")

        elif bundle_choice == "4":
            flex_price = get_valid_amount("Enter amount (GHS 0 - 400): ", min(400, ab.amount))
            data_mb = round(flex_price / 0.01786, 2)
            bonus_mb = round(flex_price * 0.05, 2)
            total_mb = round(data_mb + bonus_mb, 2)
            confirm = input(f"Buy {total_mb:.2f}MB for GHS {flex_price:.2f}? 1.Yes 2.No: ")
            if confirm == "1":
                if ab.buy_bundle(flex_price, total_mb):
                    print(f"{total_mb:.2f}MB purchased. New balance: GHS {ab.amount:.2f}")
                    txn = record_transaction("Flexi Bundle", flex_price, 0.0, "Self", "Successful", ab.amount)
                    log_transaction(txn)
                else:
                    print("Insufficient balance.")

    elif choice == "3":
        if ab.data_balance <= 0:
            print("You have no data to share.")
            return ab.amount, ab.data_balance, ab.airtime_balance

        print(f"You have {ab.data_balance} MB of data")

        while True:
            recipient = input("Enter Recipient's TeleStar phone number: ")
            recipient_name = ab.find_recipient(recipient)
            if recipient_name:
                break
            print("Invalid TeleStar number. Try again.")

        while True:
            verify = input("Verify the phone number by entering it again: ")
            if verify == recipient:
                break
            print("Phone number mismatch. Please try again.")

        print(f"Proceed to share data to {recipient_name}")
        mb_to_share = get_valid_amount("Amount to share in MB: ", ab.data_balance)

        if ab.share_data(mb_to_share):
            print(f"{mb_to_share} MB has been sent successfully to {recipient}")
            print(f"Service charge: GHS {DATA_SHARE_FEE}.")
            print(f"New data balance : {ab.data_balance}")
            print(f"New balance : GHS {ab.amount}")
            txn = record_transaction("Data Share", mb_to_share, DATA_SHARE_FEE, recipient, "Successful", ab.amount)
            log_transaction(txn)
        else:
            print("Sharing failed: your bundle must exceed the amount shared and your cash must cover the fee.")

    return ab.amount, ab.data_balance, ab.airtime_balance


# ─────────────────────────── ALLOW CASH OUT ──────────────────────────

class CashOut():
    def __init__(self, current_balance: float, momopin: str):
        self.amount = current_balance
        self.pin = momopin
        self.merchant_name = ""
        self.cashout_amount = 0.0

    def get_cashout_merchant(self) -> bool:
        if not cashout_merchant_dict:
            return False
        entry = random.choice(cashout_merchant_dict)
        self.merchant_name = list(entry.values())[0]
        self.cashout_amount = float(list(entry.values())[1])
        return True

    def charges(self, amount: float) -> float:
        return round(amount * CASHOUT_FEE, 2)

    def cashout(self, amount: float) -> tuple:
        cashout_fee = self.charges(amount)
        total = amount + cashout_fee
        if total <= self.amount:
            self.amount = round(self.amount - total, 2)
            return True, self.amount, cashout_fee
        return False, self.amount, cashout_fee


def allow_cashout(current_balance, MOMO_pin):
    co = CashOut(current_balance, MOMO_pin)

    while True:
        choice = input("Allow CashOut?\n1. Yes\n2. No\nEnter choice (1-2): ")
        if choice in ["1", "2"]:
            break
        print("Invalid choice.")

    if choice == "1":
        if not co.get_cashout_merchant():
            print("No cashout merchants available.")
            return current_balance

        print(f"Cashout Merchant: {co.merchant_name}")
        print(f"Cashout Amount: GHS {co.cashout_amount:.2f}")

        cashout_fee = co.charges(co.cashout_amount)
        if co.cashout_amount + cashout_fee > co.amount:
            print(f"Insufficient balance. Total required: GHS {co.cashout_amount + cashout_fee:.2f}")
            return current_balance

        confirm = input(f"Authorize GHS {co.cashout_amount:.2f} cashout to {co.merchant_name}? 1.Yes 2.No: ")
        if confirm == "1":
            pin_input = input("Enter your MOMO PIN: ")
            validate_pin(pin_input, MOMO_pin)

            success, new_balance, cashout_fee = co.cashout(co.cashout_amount)
            if success:
                print(f"Cashout of GHS {co.cashout_amount:.2f} to {co.merchant_name} successful")
                print(f"Fee: GHS {cashout_fee:.2f}. New balance: GHS {co.amount:.2f}")
                txn = record_transaction("Cash Out", co.cashout_amount, cashout_fee, co.merchant_name, "Successful", co.amount)
                log_transaction(txn)
                current_balance = co.amount

    return current_balance


# ─────────────────────────── FINANCIAL SERVICES ──────────────────────

class FinancialServices():
    def __init__(self, current_balance: float, momopin: str):
        self.amount = current_balance
        self.pin = momopin

    def borrow(self, amount: float) -> tuple:
        global loan_balance, loan_taken_time
        if amount > LOAN_LIMIT:
            return False, self.amount
        self.amount = round(self.amount + amount, 2)
        loan_balance = round(loan_balance + amount, 2)
        loan_taken_time = datetime.datetime.now()
        return True, self.amount

    def repay(self, amount: float) -> tuple:
        global loan_balance
        if loan_balance == 0:
            return False, self.amount, 0
        paid = min(amount, loan_balance)
        if paid <= self.amount:
            self.amount = round(self.amount - paid, 2)
            loan_balance = round(loan_balance - paid, 2)
            return True, self.amount, paid
        return False, self.amount, 0

    def get_loan_due(self) -> float:
        if loan_balance == 0 or loan_taken_time is None:
            return loan_balance
        elapsed = datetime.datetime.now() - loan_taken_time
        months = elapsed.total_seconds() / 60
        interest = round(loan_balance * (LOAN_RATE / 12) * months, 2)
        return round(loan_balance + interest, 2)


def financial_services(current_balance):
    fs = FinancialServices(current_balance, DEFAULT_PIN)

    print("\nFinancial Services - LT InstantLoans:")
    print("1. Borrow")
    print("2. Repay Loan")

    while True:
        choice = input("Enter choice (1-2): ")
        if choice in ["1", "2"]:
            break
        print("Invalid choice.")

    if choice == "1":
        if loan_balance > 0:
            print(f"You already have an outstanding loan of GHS {loan_balance:.2f}")
            return current_balance

        borrow_amount = get_valid_amount(f"Enter amount to borrow (max GHS {LOAN_LIMIT:.2f}): ", LOAN_LIMIT)
        confirm = input(f"Borrow GHS {borrow_amount:.2f}? 1.Yes 2.No: ")
        if confirm == "1":
            success, new_balance = fs.borrow(borrow_amount)
            if success:
                print(f"GHS {borrow_amount:.2f} loan approved. New balance: GHS {fs.amount:.2f}")
                print(f"Loan accrues {LOAN_RATE * 100:.0f}% p.a. interest.")
                txn = record_transaction("Loan Borrow", borrow_amount, 0.0, "LT InstantLoans", "Successful", fs.amount)
                log_transaction(txn)
                current_balance = fs.amount
            else:
                print(f"Loan amount exceeds limit of GHS {LOAN_LIMIT:.2f}")

    elif choice == "2":
        if loan_balance == 0:
            print("You have no outstanding loan.")
            return current_balance

        total_due = fs.get_loan_due()
        print(f"Outstanding loan: GHS {loan_balance:.2f}")
        print(f"Total due with interest: GHS {total_due:.2f}")

        repay_amount = get_valid_amount("Enter repayment amount: ", current_balance)
        confirm = input(f"Repay GHS {repay_amount:.2f}? 1.Yes 2.No: ")
        if confirm == "1":
            success, new_balance, paid = fs.repay(repay_amount)
            if success:
                print(f"GHS {paid:.2f} repaid. Remaining loan: GHS {loan_balance:.2f}")
                print(f"New balance: GHS {fs.amount:.2f}")
                txn = record_transaction("Loan Repay", paid, 0.0, "LT InstantLoans", "Successful", fs.amount)
                log_transaction(txn)
                current_balance = fs.amount
            else:
                print("Insufficient balance to repay.")

    return current_balance


# ─────────────────────────── MY WALLET ───────────────────────────────

class MyWallet():
    def __init__(self, current_balance: float, momopin: str):
        self.amount = current_balance
        self.pin = momopin

    def check_balance(self) -> float:
        return self.amount

    def change_pin(self, old_pin: str, new_pin: str) -> bool:
        if old_pin == self.pin:
            self.pin = new_pin
            return True
        return False

    def mini_statement(self) -> list:
        return history

    def find_transaction(self, txn_id: str):
        for txn in history:
            if str(txn["txn_id"]) == txn_id:
                return txn
        return None

    def self_reversal(self, txn_id: str) -> tuple:
        txn = self.find_transaction(txn_id)
        if txn is None:
            return False, 0.0
        refund = txn["amount"]
        self.amount = round(self.amount + refund, 2)
        return True, refund


def my_wallet(current_balance, MOMO_pin, data_balance, airtime_balance):
    wallet = MyWallet(current_balance, MOMO_pin)

    print("\nMy Wallet:")
    print("1. Check Balance")
    print("2. Mini Statement")
    print("3. Change MOMO PIN")
    print("4. Report Fraud")

    while True:
        wallet_choice = input("Enter choice (1-4): ")
        if wallet_choice in ["1", "2", "3", "4"]:
            break
        print("Invalid choice.")

    if wallet_choice == "1":
        pin_input = input("Enter MOMO PIN: ")
        validate_pin(pin_input, MOMO_pin)
        print(f"Current balance: GHS {wallet.check_balance():.2f}")
        print(f"Data balance: {data_balance:.2f} MB")
        print(f"Airtime balance: GHS {airtime_balance:.2f}")

    elif wallet_choice == "2":
        pin_input = input("Enter MOMO PIN: ")
        validate_pin(pin_input, MOMO_pin)
        txns = wallet.mini_statement()
        if not txns:
            print("No transactions yet.")
        else:
            print("\nTransaction History:")
            for txn in txns:
                print(display_transaction(txn))

    elif wallet_choice == "3":
        old_pin = input("Enter current MOMO PIN: ")
        validate_pin(old_pin, MOMO_pin)

        new_pin = input("Enter new 4-digit MOMO PIN: ")
        while len(new_pin) != 4 or not new_pin.isdigit():
            new_pin = input("Invalid PIN. Enter 4 digits: ")

        confirm_pin = input("Confirm new MOMO PIN: ")
        while confirm_pin != new_pin:
            confirm_pin = input("PINs don't match. Confirm again: ")

        wallet.change_pin(old_pin, new_pin)
        MOMO_pin = new_pin
        print("MOMO PIN successfully changed!")

    elif wallet_choice == "4":
        print("--------------------Report Fraud--------------------")
        print("1. Self Reversal (Same Network)")
        print("2. Request Reversal (Other Networks)")
        print("---------------------------------------------------------")

        while True:
            fraud_choice = input("Select an option : ")
            if fraud_choice in ["1", "2"]:
                break
            print("Invalid choice.")

        if fraud_choice == "1":
            txn_id = input("Enter the Transaction ID to reverse: ")
            success, refund = wallet.self_reversal(txn_id)
            if success:
                print(f"Transaction {txn_id} reversed. GHS {refund:.2f} has been refunded.")
                print(f"New Balance: GHS {wallet.amount:.2f}")
                txn = record_transaction("Fraud Reversal", refund, 0.0, "Owner", "Reversed", wallet.amount)
                log_transaction(txn)
            else:
                print(f"Transaction {txn_id} not found.")
        else:
            txn_id = input("Enter the Transaction ID: ")
            wrong_number = input("Enter the Wrong Recipient Number: ")
            print(f"Request received for Wrong Transaction reversal. ID : {txn_id}")
            print(f"A reversal request has been sent to the network of {wrong_number}")
            print("You will be notified once resolved")
            txn = record_transaction("Fraud Report", 0.0, 0.0, wrong_number, "Reported", wallet.amount)
            log_transaction(txn)

    return wallet.amount, MOMO_pin
