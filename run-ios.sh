#!/bin/bash

# Start Metro in the background
echo "Starting Metro..."
npx react-native start --reset-cache &
METRO_PID=$!

# Wait a moment for Metro to start
sleep 5

# Run the iOS app directly with xcodebuild
echo "Building and running iOS app..."
cd ios
xcodebuild -workspace coffeeShop.xcworkspace -scheme coffeeShop -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 16' build

# If build succeeds, run the app
if [ $? -eq 0 ]; then
    echo "Build successful! Opening simulator..."
    xcrun simctl boot "iPhone 16" 2>/dev/null || true
    xcrun simctl install "iPhone 16" build/Build/Products/Debug-iphonesimulator/coffeeShop.app
    xcrun simctl launch "iPhone 16" com.coffeeshop
else
    echo "Build failed!"
    kill $METRO_PID 2>/dev/null || true
    exit 1
fi

# Keep Metro running
wait $METRO_PID
