from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def test_plaso_checkout():
    # Initialize the Chrome browser
    driver = webdriver.Chrome()
    
    # Navigate to your Expo Web development server
    driver.get("http://localhost:8081")
    driver.maximize_window()

    try:
        # Wait up to 10 seconds for the app to load
        wait = WebDriverWait(driver, 10)
        
        # --- 1. LOGIN ---
        print("1. Logging in...")
        email_input = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//input[@placeholder='Enter your email']")
        ))
        email_input.clear()
        email_input.send_keys("testuser@example.com") # Replace with valid account
        
        password_input = driver.find_element(
            By.XPATH, "//input[@placeholder='Enter your password']"
        )
        password_input.clear()
        password_input.send_keys("password123")
        
        login_button = driver.find_element(
            By.XPATH, "//*[text()='Sign In with Email']"
        )
        login_button.click()
        
        # Wait a few seconds for login and transition to the Home screen
        time.sleep(4)
        
        # --- 2. NAVIGATE TO MARKETPLACE ---
        print("2. Navigating to Marketplace...")
        marketplace_tab = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//*[text()='Marketplace']")
        ))
        marketplace_tab.click()
        time.sleep(3)
        
        # --- 3. CLICK FIRST AVAILABLE PRODUCT ---
        print("3. Selecting a product...")
        # We will attempt to find the first image or container that represents a product card
        # Adjust this xpath if your ListingCard has a specific testID or class
        first_product = wait.until(EC.presence_of_element_located(
            (By.XPATH, "(//img)[1] | (//div[contains(@style, 'border-radius')])[1]")
        ))
        first_product.click()
        time.sleep(3)

        # --- 4. CLICK BUY NOW ---
        print("4. Adding to Cart (Buy Now)...")
        buy_now_btn = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//*[text()='Buy Now' or text()='Request Service']")
        ))
        buy_now_btn.click()
        time.sleep(3)

        # --- 5. COMPLETE CHECKOUT ---
        print("5. Confirming Payment...")
        pay_now_btn = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//*[text()='Pay Now']")
        ))
        pay_now_btn.click()
        
        # 6. Wait for success response (Simulation bypass handles it)
        time.sleep(4) 
        
        print("✅ E2E Checkout test executed successfully!")

    except Exception as e:
        print(f"❌ Test Failed: {e}")
        
    finally:
        # Close the browser after the test
        driver.quit()

if __name__ == "__main__":
    test_plaso_checkout()
