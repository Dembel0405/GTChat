const axios = require('axios');
const cheerio = require('cheerio');

class WebScraper {
    constructor() {
        this.baseUrl = 'https://ahpc.edu.kz';
    }

    async getNews() {
        try {
            const response = await axios.get(`${this.baseUrl}`);
            const $ = cheerio.load(response.data);
            const news = [];

            // Находим все новостные элементы
            $('.post-card').each((i, element) => {
                const title = $(element).find('.entry-title').text().trim();
                const date = $(element).find('.posted-on time').text().trim();
                const link = $(element).find('.entry-title a').attr('href');
                const image = $(element).find('img').attr('src');
                
                if (title && link) {
                    news.push({
                        title,
                        date,
                        link,
                        image
                    });
                }
            });

            return news;
        } catch (error) {
            console.error('Error fetching news:', error);
            throw error;
        }
    }

    async getNewsDetails(url) {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            
            const title = $('.entry-title').text().trim();
            const date = $('.posted-on time').text().trim();
            const content = $('.entry-content').text().trim();
            const author = $('.author-name').text().trim();
            const image = $('.post-thumbnail img').attr('src');

            return {
                title,
                date,
                content,
                author,
                image
            };
        } catch (error) {
            console.error('Error fetching news details:', error);
            throw error;
        }
    }

    async getContacts() {
        try {
            const response = await axios.get(`${this.baseUrl}`);
            const $ = cheerio.load(response.data);
            
            return {
                phone: {
                    admissions: '+7 (771) 149 12-02',
                    hotline: '+7 (7132) 578-491'
                },
                address: 'Республика Казахстан, г. Актобе, район Астана, Рыскулова 267',
                email: 'info@apk-edu.kz'
            };
        } catch (error) {
            console.error('Error fetching contacts:', error);
            throw error;
        }
    }

    async searchWebsite(query) {
        try {
            // Поиск по главной странице (базовая реализация)
            const response = await axios.get(`${this.baseUrl}`);
            const $ = cheerio.load(response.data);
            const results = [];

            $('*').each((i, element) => {
                const text = $(element).text().toLowerCase();
                if (text.includes(query.toLowerCase())) {
                    const title = $(element).find('h1, h2, h3, h4, h5, h6').first().text().trim();
                    const link = $(element).find('a').first().attr('href');
                    if (title && link && !results.some(r => r.link === link)) {
                        results.push({
                            title,
                            link,
                            preview: text.substring(0, 200) + '...'
                        });
                    }
                }
            });

            return results;
        } catch (error) {
            console.error('Error searching website:', error);
            throw error;
        }
    }
}

module.exports = WebScraper;
