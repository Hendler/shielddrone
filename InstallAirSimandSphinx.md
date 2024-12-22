To get started with Colosseum and Parrot Sphinx, follow these steps:

Running Colosseum:

Install Unreal Engine:

Download and install the Epic Games Launcher from the Epic Games website.
Through the launcher, install Unreal Engine version 5.2 or later.
Clone the Colosseum Repository:

Open a terminal and execute:
bash
Copy code
git clone https://github.com/CodexLabsLLC/Colosseum.git
Navigate to the Colosseum directory:
bash
Copy code
cd Colosseum
Build Colosseum:

For macOS, ensure you have CMake installed.
Run the setup and build scripts:
bash
Copy code
./setup.sh
./build.sh
Set Up an Unreal Environment:

Colosseum includes a "Blocks Environment" you can use.
Follow the instructions in the Custom Unreal Environment guide to set it up.
Launch Colosseum:

Open the Unreal project associated with Colosseum.
Press the "Play" button within the Unreal Editor to start the simulation.
Downloading Parrot Sphinx:

Parrot Sphinx is primarily designed for Linux systems, specifically Ubuntu. To install it:

Set Up the Parrot Repository:

Open a terminal and add the Parrot repository:
bash
Copy code
curl --fail --silent --show-error --location https://debian.parrot.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/debian.parrot.com.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/debian.parrot.com.gpg] https://debian.parrot.com/ $(lsb_release -cs) main generic" | sudo tee /etc/apt/sources.list.d/debian.parrot.com.list
sudo apt update
Install Parrot Sphinx:

After updating the package list, install Sphinx:
bash
Copy code
sudo apt install parrot-sphinx
Log out and log back in to complete the installation.
Install Unreal Engine Applications:

List available Unreal Engine applications:
bash
Copy code
apt-cache search parrot-ue4
Install the desired application (e.g., for an empty environment):
bash
Copy code
sudo apt install parrot-ue4-empty
Start the Firmware Service:

Ensure the firmware service is running:
bash
Copy code
sudo systemctl start firmwared.service
Launch a Simulation:

Start a simulation with a specific drone model:
bash
Copy code
sphinx /opt/parrot-sphinx/usr/share/sphinx/drones/anafi_ai.drone::firmware="https://firmware.parrot.com/Versions/anafi2/pc/%23latest/images/anafi2-pc.ext2.zip"
In a new terminal, launch the Unreal Engine application:
bash
Copy code
parrot-ue4-empty
For detailed instructions and additional information, refer to the Parrot Sphinx Installation Guide and the Quick Start Guide.

Note: Parrot Sphinx is not officially supported on macOS. Running it on macOS may require additional configuration and is not guaranteed to work.

Suggested Next Steps:

For Colosseum:

Explore the Colosseum GitHub Repository for more examples and documentation.
Join the Colosseum Robotics Discord to connect with the community.
For Parrot Sphinx:

Review the Parrot Developer Portal for comprehensive guides and support.
Consider setting up a Linux environment, such as a virtual machine or dual-boot system, to run Sphinx if you're primarily using macOS.