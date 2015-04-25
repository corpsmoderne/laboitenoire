var S = {
  // Twitter app parameters goes here to get yours: https://apps.twitter.com/
  TWITTER: {
    consumer_key:         'YOUR TWITTER CONSUMER KEY GOES HERE',
    consumer_secret:      'YOUR TWITTER CONSUMER SECRET GOES HERE',
    access_token:         'YOUR TWITTER ACCESS TOKEN GOES HERE',
    access_token_secret:  'YOUR TWITTER ACCESS TOKEN SECRET GOES HERE',
  },
  // Keywords monitored on Twitter
  KEYWORDS: [ '#PJLRenseignement', 
	      "#LoiRenseignement",
              'terrorisme',
              'terroriste',
              'liberté',
              'vie privé',
              'attentat'
            ],
  // network parameters used if run as root
  ROOT: { PORT: 80,
          IP: "", // set it if you want to listen on a special IP
          UID: 1000, // user id we switch to after opening the socket
          GID: 1000  // user gid...
        }
  // network parameters used if run as user
  USER: { PORT: 8000,
          IP: "" }
};

module.exports = S;