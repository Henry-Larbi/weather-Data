import urllib.request
import csv
import io
import pandas as pd

PHONE_URL = "https://drive.google.com/uc?export=download&id=1GykxRYx92vm281vH26XJ7RG3xnP5kvsy"
MERCHANT_URL = "https://drive.google.com/uc?export=download&id=1m7hqDeJ1ONnEz3cJ225PYB6YHop1hMPj"
METER_URL = "https://drive.google.com/uc?export=download&id=1JMXmqsSq5vlVvLaqDKWiZ96_E5xbRGlO"
DSTV_URL = "https://drive.google.com/uc?export=download&id=1afcwtgxgdmw-Fn2cx58kIdOiGJ7bcBd3"
CASHOUT_URL = "https://drive.google.com/uc?export=download&id=1afcwtgxgdmw-Fn2cx58kIdOiGJ7bcBd3"
MOMO_PIN = 7209

def load_csv(url):
    with urllib.request.urlopen(url) as r:
        data = r.read().decode("utf-8")
    return list(csv.DictReader(io.StringIO(data)))

CUSTOMER_NUMBERS = load_csv(PHONE_URL)
MERCHANT_NUMBERS = load_csv(MERCHANT_URL)
DSTV_URLS = load_csv(DSTV_URL)
CASHOUT_URLS = load_csv(CASHOUT_URL)
current_balance = 1000

def main_display():
    print("\nWelcome to the Telestar Mobile Money! Please select an option:")
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
    def __init__(self, current_balance: int, momopin: int):
        self.amount = current_balance
        self.pin = momopin
        self.recipient_number = ""
        self.recipient_name = ""

    def prompt(self):
        print("\n Transfer Money: \n")
        print("1. Telester Network \n")
        print("2. Other Networks \n")

    def TeleStar_Network(self, choice: int) -> bool:
        if choice == 1:
            return True
        else:
            return False

    def Number(self, number: str) -> tuple:
        if number[:3] == "059" and len(number) == 10:
            for numbers in CUSTOMER_NUMBERS:
                if numbers['Customer Number'] == number:
                    self.recipient_name = numbers['Name']
                    self.recipient_number = numbers["Customer Number"]
                    break
            return True, number
        else:
            return False, None

    def charges(self, amount: int) -> tuple:
        service = round(amount * 0.004, 2)
        charge = round(amount * 0.1, 2)
        total_charge = service + charge
        return total_charge, service, charge

    def Transfer_amount(self, amount: int, total_charge: float) -> tuple:
        if amount + total_charge <= self.amount:
            self.amount = self.amount - (total_charge + amount)
            return self.amount, True
        else:
            return self.amount, False

    def message(self, amount: int, recipient_number: str, service: float, charge: float):
        print(f"  GHS {amount:.2f} has been sent successfully to {self.recipient_name}, "
              f"with E-levy charge of GHS {round(charge, 2):.2f} \n"
              f"Service charge: GHS {round(service, 2):.2f} \n"
              f"New balance: GHS {self.amount:.2f} \n")


def transfer_money(current_balance, MOMO_pin):
    startover = "yes"
    while startover == "yes":
        startup = Transfer_money(current_balance, MOMO_pin)
        startup.prompt()
        while True:
            choice = input("Enter your transfer choice (1/2): ")
            try:
                next_choice = startup.TeleStar_Network(int(choice))
            except ValueError:
                next_choice = False
            if next_choice:
                break
            else:
                print("Invalid choice")
                continue

        while True:
            choice_2 = input("Enter the recipient's TeleStar phone number (should start with 059): ")
            next_choice_2, recipient_number = startup.Number(choice_2)
            if next_choice_2:
                break
            else:
                print("Invalid Number")
                continue

        while True:
            choice_3 = input("Verify the phone number by entering it again: ")
            if choice_3 == recipient_number:
                break
            else:
                print("Phone number mismatch. Please try again.")
                continue

        while True:
            try:
                amount = float(input("Enter the amount to transfer: "))
                if amount <= 0:
                    print("Amount must be greater than 0.")
                    continue
                break
            except ValueError:
                print("Invalid amount. Please enter a valid number.")
                continue

        total_charge, service, charge = startup.charges(amount)
        new_balance, confirm = startup.Transfer_amount(amount, total_charge)

        if not confirm:
            print("Insufficient balance. Transaction cancelled.")
            startover = input("Do you want to perform another transfer? (yes/no): ").lower()
            continue

        startup.message(amount, recipient_number, service, charge)
        current_balance = startup.amount
        startover = input("Do you want to perform another transfer? (yes/no): ").lower()

    return current_balance


# ─────────────────────────── MOMO PAY ────────────────────────────────

class MomoPay():
    def __init__(self, current_balance: float, momopin: int):
        self.amount = current_balance
        self.pin = momopin
        self.merchant_name = ""
        self.merchant_number = ""

    def find_merchant(self, number: str) -> bool:
        for merchant in MERCHANT_NUMBERS:
            if merchant['Merchant Number'] == number:
                self.merchant_name = merchant['Merchant Name']
                self.merchant_number = merchant['Merchant Number']
                return True
        return False

    def charges(self, amount: float) -> tuple:
        service = round(amount * 0.005, 2)
        total_charge = service
        return total_charge, service

    def pay(self, amount: float, total_charge: float) -> tuple:
        if amount + total_charge <= self.amount:
            self.amount = self.amount - (amount + total_charge)
            return self.amount, True
        return self.amount, False

    def message(self, amount: float, service: float):
        print(f"\n  GHS {amount:.2f} paid successfully to {self.merchant_name} ({self.merchant_number}).")
        print(f"  Service charge: GHS {service:.2f}")
        print(f"  New balance: GHS {self.amount:.2f}\n")


def momo_pay(current_balance, MOMO_pin):
    startover = "yes"
    while startover == "yes":
        pay = MomoPay(current_balance, MOMO_pin)
        print("\n--- MOMO Pay ---")

        while True:
            merchant_num = input("Enter Merchant Number: ").strip()
            if pay.find_merchant(merchant_num):
                print(f"  Merchant: {pay.merchant_name}")
                break
            else:
                print("Merchant not found. Please try again.")

        while True:
            try:
                amount = float(input("Enter amount to pay: GHS "))
                if amount <= 0:
                    print("Amount must be greater than 0.")
                    continue
                break
            except ValueError:
                print("Invalid amount.")
                continue

        while True:
            pin = input("Enter your MOMO PIN: ")
            try:
                if int(pin) == pay.pin:
                    break
                else:
                    print("Incorrect PIN. Try again.")
            except ValueError:
                print("Invalid PIN.")

        total_charge, service = pay.charges(amount)
        print(f"\n  Summary: GHS {amount:.2f} to {pay.merchant_name}")
        print(f"  Service charge: GHS {service:.2f}")
        confirm = input("  Confirm payment? (yes/no): ").lower()

        if confirm == "yes":
            _, success = pay.pay(amount, total_charge)
            if success:
                pay.message(amount, service)
                current_balance = pay.amount
            else:
                print("  Insufficient balance. Transaction cancelled.")
        else:
            print("  Transaction cancelled.")

        startover = input("Do you want to make another payment? (yes/no): ").lower()

    return current_balance


# ─────────────────────────── AIRTIME AND BUNDLES ─────────────────────

class AirtimeAndBundles():
    def __init__(self, current_balance: float, momopin: int):
        self.amount = current_balance
        self.pin = momopin

    def buy_airtime(self, amount: float, number: str) -> tuple:
        if amount <= self.amount:
            self.amount -= amount
            return True, self.amount
        return False, self.amount

    def get_bundles(self) -> dict:
        return {
            "1": {"name": "Daily 1GB", "data": "1GB", "validity": "1 day",  "price": 1.00},
            "2": {"name": "Weekly 5GB", "data": "5GB", "validity": "7 days", "price": 5.00},
            "3": {"name": "Monthly 15GB","data": "15GB","validity": "30 days","price": 15.00},
            "4": {"name": "Monthly 30GB","data": "30GB","validity": "30 days","price": 25.00},
        }

    def buy_bundle(self, bundle_key: str) -> tuple:
        bundles = self.get_bundles()
        if bundle_key not in bundles:
            return False, self.amount
        bundle = bundles[bundle_key]
        if bundle["price"] <= self.amount:
            self.amount -= bundle["price"]
            return True, self.amount, bundle
        return False, self.amount, bundle


def airtime_and_bundles(current_balance, MOMO_pin):
    startover = "yes"
    while startover == "yes":
        ab = AirtimeAndBundles(current_balance, MOMO_pin)
        print("\n--- Airtime and Bundles ---")
        print("1. Buy Airtime")
        print("2. Buy Data Bundle")

        while True:
            choice = input("Select option (1/2): ").strip()
            if choice in ("1", "2"):
                break
            print("Invalid choice.")

        # ── Airtime ──
        if choice == "1":
            print("\n  1. Buy for self")
            print("  2. Buy for others")
            sub = input("  Select (1/2): ").strip()

            if sub == "1":
                number = "self"
            else:
                while True:
                    number = input("  Enter recipient number (10 digits): ").strip()
                    if len(number) == 10 and number.isdigit():
                        break
                    print("  Invalid number.")

            while True:
                try:
                    amount = float(input("  Enter airtime amount (GHS): "))
                    if amount <= 0:
                        print("  Amount must be greater than 0.")
                        continue
                    break
                except ValueError:
                    print("  Invalid amount.")

            while True:
                pin = input("  Enter MOMO PIN: ")
                try:
                    if int(pin) == ab.pin:
                        break
                    print("  Incorrect PIN.")
                except ValueError:
                    print("  Invalid PIN.")

            success, new_balance = ab.buy_airtime(amount, number)
            if success:
                target = "your line" if number == "self" else number
                print(f"\n  GHS {amount:.2f} airtime sent to {target}.")
                print(f"  New balance: GHS {new_balance:.2f}\n")
                current_balance = new_balance
            else:
                print("  Insufficient balance.")

        # ── Data Bundle ──
        else:
            bundles = ab.get_bundles()
            print("\n  Available Bundles:")
            for k, v in bundles.items():
                print(f"  {k}. {v['name']} — GHS {v['price']:.2f} ({v['validity']})")

            while True:
                bkey = input("  Select bundle (1-4): ").strip()
                if bkey in bundles:
                    break
                print("  Invalid selection.")

            print("\n  1. Buy for self")
            print("  2. Buy for others")
            sub = input("  Select (1/2): ").strip()

            if sub == "1":
                number = "self"
            else:
                while True:
                    number = input("  Enter recipient number (10 digits): ").strip()
                    if len(number) == 10 and number.isdigit():
                        break
                    print("  Invalid number.")

            while True:
                pin = input("  Enter MOMO PIN: ")
                try:
                    if int(pin) == ab.pin:
                        break
                    print("  Incorrect PIN.")
                except ValueError:
                    print("  Invalid PIN.")

            result = ab.buy_bundle(bkey)
            success, new_balance, bundle = result[0], result[1], result[2]
            if success:
                target = "your line" if number == "self" else number
                print(f"\n  {bundle['data']} bundle activated for {target}.")
                print(f"  Validity: {bundle['validity']}")
                print(f"  Cost: GHS {bundle['price']:.2f}")
                print(f"  New balance: GHS {new_balance:.2f}\n")
                current_balance = new_balance
            else:
                print(f"  Insufficient balance. Bundle costs GHS {bundle['price']:.2f}.")

        startover = input("Do you want to buy more airtime/bundles? (yes/no): ").lower()

    return current_balance


# ─────────────────────────── ALLOW CASH OUT ──────────────────────────

class CashOut():
    def __init__(self, current_balance: float, momopin: int):
        self.amount = current_balance
        self.pin = momopin
        self.agent_name = ""
        self.agent_number = ""

    def find_agent(self, number: str) -> bool:
        for agent in CASHOUT_URLS:
            agent_key = list(agent.keys())[0]
            name_key = list(agent.keys())[1] if len(agent.keys()) > 1 else None
            if agent.get('Agent Number', agent.get(agent_key)) == number:
                self.agent_name = agent.get('Agent Name', agent.get(name_key, 'Agent'))
                self.agent_number = number
                return True
        return False

    def charges(self, amount: float) -> tuple:
        charge = round(amount * 0.01, 2)
        return charge

    def cashout(self, amount: float) -> tuple:
        charge = self.charges(amount)
        total = amount + charge
        if total <= self.amount:
            self.amount -= total
            return True, self.amount, charge
        return False, self.amount, charge


def allow_cash_out(current_balance, MOMO_pin):
    startover = "yes"
    while startover == "yes":
        co = CashOut(current_balance, MOMO_pin)
        print("\n--- Allow Cash Out ---")
        print("  Withdraw cash through a MOMO agent.\n")

        while True:
            agent_num = input("  Enter Agent Number: ").strip()
            if co.find_agent(agent_num):
                print(f"  Agent: {co.agent_name}")
                break
            else:
                print("  Agent not found. Please try again.")

        while True:
            try:
                amount = float(input("  Enter amount to withdraw (GHS): "))
                if amount <= 0:
                    print("  Amount must be greater than 0.")
                    continue
                break
            except ValueError:
                print("  Invalid amount.")

        charge = co.charges(amount)
        print(f"\n  Amount: GHS {amount:.2f}")
        print(f"  Cash-out charge: GHS {charge:.2f}")
        print(f"  Total deduction: GHS {amount + charge:.2f}")

        while True:
            pin = input("  Enter MOMO PIN to authorise: ")
            try:
                if int(pin) == co.pin:
                    break
                print("  Incorrect PIN.")
            except ValueError:
                print("  Invalid PIN.")

        confirm = input("  Confirm cash-out? (yes/no): ").lower()
        if confirm == "yes":
            success, new_balance, charge = co.cashout(amount)
            if success:
                print(f"\n  GHS {amount:.2f} cash-out authorised for agent {co.agent_name}.")
                print(f"  Charge: GHS {charge:.2f}")
                print(f"  New balance: GHS {new_balance:.2f}\n")
                current_balance = new_balance
            else:
                print("  Insufficient balance. Transaction cancelled.")
        else:
            print("  Transaction cancelled.")

        startover = input("Do you want to perform another cash-out? (yes/no): ").lower()

    return current_balance


# ─────────────────────────── FINANCIAL SERVICES ──────────────────────

class FinancialServices():
    def __init__(self, current_balance: float, momopin: int):
        self.amount = current_balance
        self.pin = momopin
        self.savings = 0.0
        self.loan_balance = 0.0

    def save_money(self, amount: float) -> tuple:
        if amount <= self.amount:
            self.amount -= amount
            self.savings += amount
            return True, self.amount
        return False, self.amount

    def request_loan(self, amount: float) -> tuple:
        # Simple eligibility: savings must be at least 20% of requested loan
        if self.savings >= amount * 0.2:
            self.amount += amount
            self.loan_balance += round(amount * 1.05, 2)   # 5% interest
            return True, self.amount
        return False, self.amount

    def repay_loan(self, amount: float) -> tuple:
        repayment = min(amount, self.loan_balance)
        if repayment <= self.amount:
            self.amount -= repayment
            self.loan_balance -= repayment
            return True, self.amount, repayment
        return False, self.amount, 0


def financial_services(current_balance, MOMO_pin):
    startover = "yes"
    fs = FinancialServices(current_balance, MOMO_pin)

    while startover == "yes":
        print("\n--- Financial Services ---")
        print("1. Save Money")
        print("2. Request Loan")
        print("3. Repay Loan")
        print("4. View Savings & Loan Balance")

        while True:
            choice = input("Select option (1-4): ").strip()
            if choice in ("1", "2", "3", "4"):
                break
            print("Invalid choice.")

        if choice == "4":
            print(f"\n  Wallet Balance : GHS {fs.amount:.2f}")
            print(f"  Savings        : GHS {fs.savings:.2f}")
            print(f"  Loan Balance   : GHS {fs.loan_balance:.2f}\n")

        elif choice == "1":
            while True:
                try:
                    amount = float(input("  Enter amount to save (GHS): "))
                    if amount <= 0:
                        print("  Amount must be greater than 0.")
                        continue
                    break
                except ValueError:
                    print("  Invalid amount.")

            while True:
                pin = input("  Enter MOMO PIN: ")
                try:
                    if int(pin) == fs.pin:
                        break
                    print("  Incorrect PIN.")
                except ValueError:
                    print("  Invalid PIN.")

            success, new_balance = fs.save_money(amount)
            if success:
                print(f"\n  GHS {amount:.2f} saved successfully.")
                print(f"  Total savings : GHS {fs.savings:.2f}")
                print(f"  Wallet balance: GHS {new_balance:.2f}\n")
                current_balance = new_balance
            else:
                print("  Insufficient balance.")

        elif choice == "2":
            while True:
                try:
                    amount = float(input("  Enter loan amount requested (GHS): "))
                    if amount <= 0:
                        print("  Amount must be greater than 0.")
                        continue
                    break
                except ValueError:
                    print("  Invalid amount.")

            while True:
                pin = input("  Enter MOMO PIN: ")
                try:
                    if int(pin) == fs.pin:
                        break
                    print("  Incorrect PIN.")
                except ValueError:
                    print("  Invalid PIN.")

            success, new_balance = fs.request_loan(amount)
            if success:
                print(f"\n  Loan of GHS {amount:.2f} approved (5% interest).")
                print(f"  Total repayable: GHS {fs.loan_balance:.2f}")
                print(f"  Wallet balance : GHS {new_balance:.2f}\n")
                current_balance = new_balance
            else:
                print(f"  Loan not approved. You need savings of at least GHS {amount * 0.2:.2f}.")

        elif choice == "3":
            if fs.loan_balance == 0:
                print("  You have no outstanding loan.\n")
            else:
                print(f"  Outstanding loan: GHS {fs.loan_balance:.2f}")
                while True:
                    try:
                        amount = float(input("  Enter repayment amount (GHS): "))
                        if amount <= 0:
                            print("  Amount must be greater than 0.")
                            continue
                        break
                    except ValueError:
                        print("  Invalid amount.")

                while True:
                    pin = input("  Enter MOMO PIN: ")
                    try:
                        if int(pin) == fs.pin:
                            break
                        print("  Incorrect PIN.")
                    except ValueError:
                        print("  Invalid PIN.")

                success, new_balance, paid = fs.repay_loan(amount)
                if success:
                    print(f"\n  GHS {paid:.2f} repaid successfully.")
                    print(f"  Remaining loan : GHS {fs.loan_balance:.2f}")
                    print(f"  Wallet balance : GHS {new_balance:.2f}\n")
                    current_balance = new_balance
                else:
                    print("  Insufficient balance to repay.")

        startover = input("Return to Financial Services menu? (yes/no): ").lower()

    return current_balance


# ─────────────────────────── MY WALLET ───────────────────────────────

class MyWallet():
    def __init__(self, current_balance: float, momopin: int):
        self.amount = current_balance
        self.pin = momopin
        self.transaction_history = []

    def check_balance(self) -> float:
        return self.amount

    def change_pin(self, old_pin: int, new_pin: int) -> bool:
        if old_pin == self.pin:
            self.pin = new_pin
            return True
        return False

    def mini_statement(self) -> list:
        return self.transaction_history if self.transaction_history else []


def my_wallet(current_balance, MOMO_pin):
    wallet = MyWallet(current_balance, MOMO_pin)
    startover = "yes"

    while startover == "yes":
        print("\n--- My Wallet ---")
        print("1. Check Balance")
        print("2. Mini Statement")
        print("3. Change MOMO PIN")

        while True:
            choice = input("Select option (1-3): ").strip()
            if choice in ("1", "2", "3"):
                break
            print("Invalid choice.")

        if choice == "1":
            while True:
                pin = input("  Enter MOMO PIN: ")
                try:
                    if int(pin) == wallet.pin:
                        break
                    print("  Incorrect PIN.")
                except ValueError:
                    print("  Invalid PIN.")
            print(f"\n  Current Wallet Balance: GHS {wallet.check_balance():.2f}\n")

        elif choice == "2":
            while True:
                pin = input("  Enter MOMO PIN: ")
                try:
                    if int(pin) == wallet.pin:
                        break
                    print("  Incorrect PIN.")
                except ValueError:
                    print("  Invalid PIN.")
            history = wallet.mini_statement()
            if not history:
                print("  No transactions found.\n")
            else:
                print("\n  --- Mini Statement ---")
                for txn in history[-10:]:
                    print(f"  {txn}")
                print()

        elif choice == "3":
            while True:
                old_pin = input("  Enter current PIN: ")
                try:
                    old_pin_int = int(old_pin)
                    break
                except ValueError:
                    print("  Invalid PIN.")

            while True:
                new_pin = input("  Enter new PIN (4 digits): ")
                try:
                    new_pin_int = int(new_pin)
                    if len(new_pin) == 4:
                        break
                    print("  PIN must be exactly 4 digits.")
                except ValueError:
                    print("  Invalid PIN — digits only.")

            if wallet.change_pin(old_pin_int, new_pin_int):
                MOMO_pin = new_pin_int
                print("  PIN changed successfully.\n")
            else:
                print("  Incorrect current PIN. PIN not changed.\n")

        startover = input("Return to My Wallet menu? (yes/no): ").lower()

    return current_balance, MOMO_pin


# ─────────────────────────── MAIN LOOP ───────────────────────────────

def main():
    global current_balance, MOMO_PIN
    print("=" * 45)
    print("   Welcome to Telestar Mobile Money")
    print("=" * 45)

    while True:
        choice = main_display()

        if choice == "1":
            current_balance = transfer_money(current_balance, MOMO_PIN)
        elif choice == "2":
            current_balance = momo_pay(current_balance, MOMO_PIN)
        elif choice == "3":
            current_balance = airtime_and_bundles(current_balance, MOMO_PIN)
        elif choice == "4":
            current_balance = allow_cash_out(current_balance, MOMO_PIN)
        elif choice == "5":
            current_balance = financial_services(current_balance, MOMO_PIN)
        elif choice == "6":
            current_balance, MOMO_PIN = my_wallet(current_balance, MOMO_PIN)
        else:
            print("Invalid option. Please select 1-6.")

        again = input("\nReturn to main menu? (yes/no): ").lower()
        if again != "yes":
            print("\nThank you for using Telestar Mobile Money. Goodbye!\n")
            break


if __name__ == "__main__":
    main()
