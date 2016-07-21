# simpleTwitter API reference

- GET / 
  - Description: Getting Index Page

- POST /register
  - Description: Register a user, a user id will be assigned and returned, password less than 6 characters will be rejected
  - Example Input Data: { password : "hello123" }
  - Example Return: {
  "success": 1,
  "message": "user created with id: 11"
}

- POST /login
  - Description: log user in
  - Example Input Data: { userId : "11", password : "hello123" }

- GET /logout
  - Description: log current session user out

- POST /tweet
  - Description: User Post a tweet (required to be a session user)
  - Example Input Data: { data : "Hello, this is my first tweet" }
  - Example Return: {
  "success": 1,
  "message": "tweet posted with tweet id 13"
}

- GET /tweet/:tweetId
  - Description: Get a specific tweet by tweet Id
  - Example Request: /tweet/11
  - Example Return: {
  "success": 1,
  "message": "the tweet is found",
  "data": {
    "id": 13,
    "author": 10,
    "createdAt": "2016-07-21T04:10:32.000Z",
    "data": "nice"
  }
}


- GET /user/:userId/tweet
  - Description: Get tweets of an user, ruturn an array of tweets
  - Example Request: /user/10/tweet
  - Example Return: {
  "success": 1,
  "message": "tweets found",
  "data": [
    {
      "id": 10,
      "author": 10,
      "createdAt": "2016-07-21T03:08:50.000Z",
      "data": "nice"
    },
    {
      "id": 11,
      "author": 10,
      "createdAt": "2016-07-21T03:08:57.000Z",
      "data": "nice1"
    },
    {
      "id": 12,
      "author": 10,
      "createdAt": "2016-07-21T03:09:00.000Z",
      "data": "nice12"
    },
    {
      "id": 13,
      "author": 10,
      "createdAt": "2016-07-21T04:10:32.000Z",
      "data": "nice"
    }
  ]
}