from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def test_plaso_login():
    # Initialize the Chrome browser
    driver = webdriver.Chrome()
    
    # Navigate to your Expo Web development server
    driver.get("http://localhost:8081")
    driver.maximize_window()

    try:
        # Wait up to 10 seconds for the app to load
        wait = WebDriverWait(driver, 10)
        
        print("1. Entering Email...")
        email_input = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//input[@placeholder='Enter your email']")
        ))
        email_input.clear()
        email_input.send_keys("testuser@example.com") # Replace with a valid test email
        
        print("2. Entering Password...")
        password_input = driver.find_element(
            By.XPATH, "//input[@placeholder='Enter your password']"
        )
        password_input.clear()
        password_input.send_keys("password123") # Replace with a valid test password
        
        print("3. Clicking Sign In...")
        # React Native Web renders buttons as interactive divs with text
        login_button = driver.find_element(
            By.XPATH, "//*[text()='Sign In with Email']"
        )
        login_button.click()
        
        # 4. Wait for the API response and Home Screen transition
        time.sleep(3) 
        
        # If no exceptions were thrown, the test is successful
        print("✅ Login test executed successfully!")

    except Exception as e:
        print(f"❌ Test Failed: {e}")
        
    finally:
        # Close the browser after the test
        driver.quit()

if __name__ == "__main__":
    test_plaso_login()
