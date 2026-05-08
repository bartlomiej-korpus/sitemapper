import 'async';
import 'assert';
import 'should';

import Sitemapper from '../../lib/assets/sitemapper.js';

describe('Sitemapper Advanced Tests', function () {
  let sitemapper: Sitemapper;

  beforeEach(() => {
    sitemapper = new Sitemapper();
  });

  describe('fetch with multiple sitemaps', function () {
    it('should handle errors in some child sitemaps while succeeding with others', async function () {
      this.timeout(10000);

      // Create a mock parse method that returns a sitemapindex with mixed results
      const originalParse = sitemapper.parse;
      const originalCrawl = sitemapper.crawl;

      // First call to parse returns sitemapindex with multiple sitemaps
      let parseCallCount = 0;
      sitemapper.parse = async () => {
        parseCallCount++;

        if (parseCallCount === 1) {
          // First call returns a sitemapindex with two sitemaps
          return {
            data: {
              sitemapindex: {
                sitemap: [
                  { loc: 'https://example.com/good-sitemap.xml' },
                  { loc: 'https://example.com/bad-sitemap.xml' },
                ],
              },
            },
          };
        } else if (parseCallCount === 2) {
          // Second call (for good-sitemap) returns urlset
          return {
            data: {
              urlset: {
                url: [
                  { loc: 'https://example.com/page1' },
                  { loc: 'https://example.com/page2' },
                ],
              },
            },
          };
        } else {
          // Third call (for bad-sitemap) returns error
          return {
            error: 'Error occurred: ParseError',
            data: { name: 'ParseError' },
          };
        }
      };

      // Call fetch which will use our mocked methods
      const result = await sitemapper.fetch(
        'https://example.com/root-sitemap.xml'
      );

      // Check the result
      result.should.have.property('sites').which.is.an.Array();
      result.should.have.property('errors').which.is.an.Array();
      result.sites.length.should.equal(2);
      result.errors.length.should.equal(1);

      // Restore original methods
      sitemapper.parse = originalParse;
      sitemapper.crawl = originalCrawl;
    });
  });
});
