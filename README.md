# 🗳️ Thesis Website – Secure Digital Voting System

A full-stack digital election system designed for school-wide use, featuring QR code registration, fingerprint-secured voting, real-time results tracking, and an admin dashboard with advanced control features.

---

## 🔍 Overview  
This project is a **secure digital voting kiosk system** developed for academic elections. The software powers both public-facing features (like candidate info and live voting updates) and an admin dashboard with sensitive backend controls.

The actual voting interface was deployed **exclusively on the physical kiosk**, which integrates **QR code registration** and **fingerprint verification** for authentication.

I was **solely responsible** for the entire software stack — including frontend, backend, and database architecture.

---

## 🚀 Features

### 🔓 Public Access (Students)
- **Candidate Profiles**  
  View details of candidates and parties with full mobile responsiveness.

- **Live Votes**  
  Real-time vote counts with three breakdown views:  
  - Total votes per candidate  
  - Departmental breakdown  
  - Candidate vs. candidate comparison per department

### 🔐 Admin-Only Controls
- **JWT-Protected Admin Panel**  
  Secure routing with bcrypt-hashed login and biometric recovery fallback.

- **Election Configuration**  
  Set voting timeframe; restrict access outside valid dates.

- **Candidate Management**  
  Add, edit, or remove candidate and party list data.

- **Database Backup & Export**  
  Save full election data to backup list; generate PDF summaries.

- **Access Control**  
  Change admin password directly or via biometric fallback if locked out.

- **Reset System**  
  Wipe election data (voters, candidates, logs) while preserving backups and admin credentials.

---

## 📂 Tech Stack

| Layer     | Tools / Frameworks                                            |
|-----------|---------------------------------------------------------------|
| Frontend  | ReactJS, CSS                                                  |
| Backend   | Revel (Golang), JWT, bcrypt                                   |
| Database  | MySQL                                                         |
| Hosting   | Vercel (Frontend), Local Tunnel via Ngrok (Backend & Database)|

---

## 🔗 Preview  
For a more detailed breakdown, including screen recordings, please refer to the portfolio section: [https://jaimeleiindick.vercel.app](https://jaimeleiindick.vercel.app)

---

## 📘 Work Structure  
> ⚠️ *Note: The initial commit reflected in my GitHub includes most core features, as I first built the project to test deployment and layout. Later commits cover changes to accomodate the physical kiosk and will not be included in this section. I’ve done feature-by-feature commits during internship, even using sepearate branches, and plan to apply that consistently moving forward.*

001 | Frontend | Feature | Landing Page  
- Created the landing page.

002 | Frontend | Feature | Admin Page  
- Created the general layout of the admin page with a sidebar.

003 | Frontend | Feature | Admin Page  
- Added tooltips for each section.

004 | Backend | Feature  
- Created an endpoint that injects the default password.

005 | Backend | Feature  
- Created an endpoint for signing in.

006 | Frontend | Feature | Authentication Page  
- Created the authentication page.

007 | Backend | Feature  
- Created an endpoint to post the voting timeframe.

008 | Frontend | Feature | Admin Page  
- Created the Voting Timeframe section under the Elections tab.

009 | Frontend | Feature | Admin Page  
- Created a reusable, dynamic modal to confirm an action or cancel it.

010 | Backend | Feature  
- Created an endpoint to change the password.

011 | Frontend | Feature | Admin Page  
- Created the Change Password section under the Access Control tab.

012 | Backend | Feature  
- Created an endpoint to delete everything from the database except for the admin credentials.

013 | Frontend | Feature | Admin Page  
- Created the Delete Election Data section under the Reset tab.

014 | Backend | Feature  
- Created an endpoint to fetch total votes, using position_name (e.g. Governor_Candidate A) as the parameter.

015 | Backend | Feature  
- Created an endpoint to fetch a candidate’s votes for a specific department, using position_name and department as the parameters.

016 | Backend | Feature  
- Created an endpoint to post votes for the following positions: Governor, Vice Governor, and Board Member. It accepts empty submissions to accommodate the abstain feature. Votes are recorded under the voter’s corresponding department.

017 | Backend | Feature  
- Created an endpoint to fetch all candidates.

018 | Frontend | Feature | Voting Page  
- Created a bare-bones structure for the voting page, including a utility function that determines which board member to display based on the voter’s program. This excludes the fingerprint identification feature.

019 | Frontend | Feature | Registration Page  
- Created a bare-bones structure for the registration page, excluding QR scanner and fingerprint scanner.

020 | Backend | Feature  
- Created an endpoint to fetch the election status indicating whether it's active or not.

021 | Frontend | Feature | Voting Page  
- Created a simple logic that locks the voting page if the election status is inactive.

022 | Backend | Feature  
- Added JWT token generation upon signing in to secure the backend from unauthorized access. This token expires an hour after, which will prompt the admin to re-login as an extra layer of security.

023 | Frontend | Feature | Admin Page  
- Created a private route to restrict direct access to the admin page without signing in.

024 | Backend | Feature  
- Created a backup feature using excelize.

025 | Backend | Bug  
- Fixed the issue where the Excel files were empty due to corruption. Updated the Revel version because Excelize was incompatible.

026 | Frontend | Feature | Admin Page  
- Created the Backup List section under the Backup & Download tab.

027 | Frontend | Feature  
- Created a navigation bar.

028 | Frontend | Feature | Candidates Page  
- Created the candidates page.

029 | Frontend | Feature | Live Votes Page  
- Created the live votes page.

030 | Frontend | Feature | Admin Page  
- Created the Manage Candidacy section under the Elections tab.

031 | Backend | Feature  
- Created an endpoint to post a batch of candidate data.

032 | Frontend | Feature | Admin Page  
- Created a popup modal for adding candidates.

033 | Backend | Feature  
- Created an endpoint to post a batch of candidate credentials.

034 | Frontend | Feature | Admin Page  
- Created a popup modal for adding credentials.

035 | Frontend | Feature | Voting Page  
- Created the voting flow to display the three candidates the voter is allowed to vote for, including posting of votes. This excludes the fingerprint identification feature.

036 | Frontend | Feature | Admin Page  
- Created a logout button.

037 | Frontend | Feature  
- Created a responsive design for the Candidates and Live Votes pages on mobile.

038 | Frontend | Feature  
- Created a restriction that blocks access to the authentication and admin pages on mobile devices, allowing access only from laptops or desktops.

039 | Backend | Feature  
- Created an endpoint to edit candidate data.

040 | Frontend | Feature | Admin Page  
- Created a tooltip to edit candidate details.

041 | Backend | Feature  
- Created an endpoint to edit candidate credentials.

042 | Frontend | Feature | Admin Page  
- Created a tooltip to edit candidate credentials.

043 | Frontend | Bug | Admin Page  
- Fixed a layering issue with the custom tooltip being in front of the modal.

044 | Frontend | Bug | Admin Page  
- Fixed an issue with the card modal not closing after confirmation.

045 | Frontend | Bug | Admin Page  
- Fixed an issue with the voting timeframe accepting an end time earlier than the start time.

046 | Frontend | Feature  
- Created responsive design for tablet and laptop sizes.

047 | Frontend | Bug  
- Fixed broken mobile and desktop styling.
