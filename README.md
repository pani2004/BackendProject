# VideoTube

## Overview
VideoTube is a video application backend created using Node.js, Express.js, MongoDB, and Mongoose. It features essential functionalities such as user authentication, video uploading, liking/disliking videos, commenting, replying, and channel subscription management. The system prioritizes security using JWT (JSON Web Tokens) and Bcrypt.

## Key Features
- **Authentication:** Secure user authentication using JWT and bcrypt.
- **Video Management:** Upload, like, dislike, and comment on videos.
- **User Interaction:** Reply to comments, subscribe, and unsubscribe to channels.
- **Security:** Implemented access and refresh tokens to ensure secure API endpoints.

## Technologies Used
- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **JWT (JSON Web Tokens)**
- **Bcrypt**

## Security Features
- **Access and Refresh Tokens:** The system uses access and refresh tokens to secure API endpoints and ensure safe user authentication.
- **Password Encryption:** User passwords are securely hashed using Bcrypt before storing in the database.