const ghpages = require('gh-pages');

ghpages.publish(
  'dist',
  {
    branch: 'gh-pages',
    repo: 'https://github.com/shaina2005/shiv_softs.git',
    history: false,
    clone: 'C:/ghcache/shivsofts',
  },
  (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log('Published successfully!');
  }
);