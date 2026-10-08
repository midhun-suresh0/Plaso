from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import random

def test_plaso_edit_profile():
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
        # NOTE: Make sure this email matches an account that exists in your database
        email_input.send_keys("testuser@example.com")
        
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
        
        # --- 2. NAVIGATE TO PROFILE ---
        print("2. Navigating to Profile...")
        # Finding the Profile tab button on the bottom navigation bar
        # Depending on your exact layout, we look for the text 'Profile' or 'My Profile'
        profile_tab = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//*[text()='Profile' or text()='My Profile']")
        ))
        profile_tab.click()
        time.sleep(2)
        
        # --- 3. CLICK EDIT PROFILE ---
        print("3. Opening Edit Profile Screen...")
        edit_profile_btn = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//*[contains(text(), 'Edit Profile')]")
        ))
        edit_profile_btn.click()
        time.sleep(2)

        # --- 4. UPDATE BIO ---
        print("4. Updating Bio...")
        bio_input = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//input[@placeholder='Tell us about yourself'] | //textarea[@placeholder='Tell us about yourself']")
        ))
        bio_input.clear()
        
        random_bio = f"Automated test bio updated at timestamp {int(time.time())}"
        bio_input.send_keys(random_bio)
        
        # --- 5. SAVE PROFILE ---
        print("5. Saving Profile...")
        save_button = driver.find_element(
            By.XPATH, "//*[text()='Save Profile']"
        )
        save_button.click()
        
        # 6. Wait for success response
        time.sleep(3) 
        
        print("✅ Edit Profile test executed successfully!")

    except Exception as e:
        print(f"❌ Test Failed: {e}")
        
    finally:
        # Close the browser after the test
        driver.quit()

if __name__ == "__main__":
    test_plaso_edit_profile()
