import os
from indexnumber import (
    main_display,
    transfer_money,
    momopay_paybill,
    airtime_bundle,
    allow_cashout,
    financial_services,
    my_wallet
)


#Main Code
def main():
    current_balance = 1000  # Starting balance
    data_balance = 0 # Starting data balance
    airtime_balance = 0 #Starting airtime amount
    MOMO_pin = "7209"  # User's 4-digit MOMO PIN
    start = True
    attempt = 0

    # Temporary fix: Clear transaction log at the start to prevent KeyError from old entries
    if os.path.exists("transaction_log.csv"):
        os.remove("transaction_log.csv")
        print("Cleared old transaction log.")

    while start:
        hashcode = input("Enter the TeleStar code: ")
        # Check if the entered code is correct
        if hashcode == "*170#":
            while True:
                # Display main menu
                choice = main_display()

                # Option 1 - Transfer Money
                if choice == "1":
                    current_balance = transfer_money(current_balance,MOMO_pin)
                # Option 2 - MomoPay and Paybill
                elif choice == "2":
                    current_balance = momopay_paybill(current_balance,MOMO_pin)
                # Option 3 - Airtime and Bundles
                elif choice == "3":
                    current_balance, data_balance, airtime_balance = airtime_bundle(current_balance, data_balance, airtime_balance)
                # Option 4 - Allow CashOut
                elif choice == "4":
                    current_balance = allow_cashout(current_balance,MOMO_pin)
                # Option 5 - Financial Services
                elif choice == "5":
                    current_balance = financial_services(current_balance)
                # Option 6 - My Wallet
                elif choice == "6":
                    current_balance, MOMO_pin = my_wallet(current_balance,MOMO_pin,data_balance,airtime_balance)

                # Ask if user wants to continue or exit
                exit_response = input("Do you want to perform another operation? (yes/no): ")
                if exit_response.lower() != "yes":
                    print("Thank you for using our service!")
                    # The original logic to remove log on exit can remain or be removed if cleared at start
                    if os.path.exists("transaction_log.csv"):
                        os.remove("transaction_log.csv")
                    start = False
                    break
        else:
            print("Invalid short code. Please try again.")
            attempt += 1
        if attempt == 3:
            start = False
            print(f"You have exhausted the maximum number of {attempt} attempts. Please restart the program")



if __name__ == "__main__":
    main()
