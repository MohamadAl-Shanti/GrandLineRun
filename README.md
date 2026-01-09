# GrandLineRun - Enjoy the python version until the game is reuploaded to S3
Grand Line Run is a multilevel web application designed to display the efficiency of serverless cloud-native architectures.

1. Project Overview:
   Grand Line Run is a cloud-native gaming application, hosted on AWS's S3. The purpose of this game was to showcase the efficiency of serverless cloud-native architectures. The game is based on the popular series, One Piece.      With the game's assets and elements drawing from its story, characters, and locations. It is a simple level-based platforming game.
   
3. Technical Architecture:
   To deliver the application the following four AWS services were used: AWS Lambda (Compute), S3 (Storage), Amazon API Gateway (Networking and Content Delivery), Amazon DynamoDB (Database).
   
   The application is built on a three-tier serverless stack: (Presentation Tier) The game is available via static website hosting, with the core js functionality and assets being stored in an S3 bucket. (Application tier)        Upon encountering the 'game over' event, the js invokes the API gateway which is set to trigger a lambda function. The lambda function queries a (Data Tier) DynamoDB database to display a level relevant quote to the player,    randomly pulled from a pool of quotes that correspond to the level within the database.

4. Security and Optimization:
   The application data is encrypted by default with S3's server-side encryption SSE-S3. I implemented a CORS policy to ensure that invocations to the API would only be accepted from the game's url. The application is still       vulnerable to DoS via high volume requests from the static website url. Implementing this as a serverless application yielded a total monthly cost of $0.03882, including all the utilised services. That cost would be            significantly lower had I considered AWS's free tier which I did not for the sake of worst-case cost calculation. For the purpose of this application, I was unable to create a custom IAM policy for the lambda function's        access of my DynamoDB database, thus violating the principle of least privilege since the default lab role used has abilities broader than access of the application's database.
  
5. Future Roadmap
   To enhance security and mitigate DoS attacks, I would use Amazon Cognito to enforce user authentication when developing cloud native applications in the future. I would also implement a custom IAM policy that would only        allow the lambda function to access application data when necessary, thus better adhering to the principle of least privilege.


A small side note. While the focus of this project was to learn about development of cloud-native applications, the game itself plays much better in its original form which was programmed via Python's game development library, Pygame. Since this library does not have native web hosting I decided to pivot to JS. I would recommend that anybody looking to enjoy themselves try the python version which is available alongside the rest of the application's code.
