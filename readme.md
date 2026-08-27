# Hackaton 2026
## NPI tracker
Create a very simple NPI tracker

The goal of this little tool is to keep track of a build

We can have a small build, composed from an 'order' which tracks the progress of N racks that will be delivered

## How it works

# GUI
- In the GUI, user can create a new build
- User can upload the BOM for such build 
- User can determine how many racks will be created

# Schema / DB
- There is a Schema in Azure that keeps track of which builds, what's the status, etc

# Backend
- There is (feature) a REST api so systems can report events on the build

