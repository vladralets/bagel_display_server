const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: '*',
}));

app.use(express.json());

let token;
let userCookies;
let fetchId; 

const formatDate = (date) => {
  // Format date as YYYY-MM-DD
  const year = date.getFullYear();
  const month = (`0${date.getMonth() + 1}`).slice(-2); // Add leading 0 if needed
  const day = (`0${date.getDate()}`).slice(-2); // Add leading 0 if needed
  return `${year}-${month}-${day}`;
};

const today = new Date();
// Format the start and end of the day
const dateFrom = `${formatDate(today)}T00:00:00`;
const dateTo = `${formatDate(today)}T23:59:00`;

const olapBody = {
	"olapType": "SALES",
	"categoryFields": [],
	"groupFields": [
			"GuestNum",
			"OrderNum",
			"CashRegisterName"
	],
	"stackByDataFields": false,
	"dataFields": [],
	"calculatedFields": [
			{
					"name": "DishDiscountSumInt",
					"title": "Sales",
					"formula": "[DishDiscountSumInt]",
					"type": "MONEY"
			}
	],
	"filters": [
			{
					"field": "OpenDate.Typed",
					"filterType": "date_range",
					"dateFrom": dateFrom,
					"dateTo": dateTo,
					"valueMin": null,
					"valueMax": null,
					"valueList": [],
					"includeLeft": true,
					"includeRight": false,
					"inclusiveList": true
			}
	],
	"includeVoidTransactions": false,
	"includeNonBusinessPaymentTypes": false
};

app.post('/get-olap-report', async (req, res) => {
  const { login, password } = req.body;

  import('node-fetch').then(fetch => {
    fetch.default('https://bagel-lounge-co.syrve.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const cookies = response.headers.raw()['set-cookie'];
      if (cookies) {
        userCookies = cookies;
				console.log('cookies', userCookies);
        cookies.forEach(cookie => {
          res.append('Set-Cookie', cookie);
        });
      }
      return response.json();
    })
    .then(data => {
			token = data.token;
			return res.json(data);
		})
    .catch(error => {
      res.status(500).json({ error: true, message: 'An error occurred while processing your request', details: error.message });
    });
  });
});

app.post('/init-olap', async (req, res) => {

  const cookies = userCookies

  import('node-fetch').then(fetch => {
    fetch.default('https://bagel-lounge-co.syrve.app/api/olap/init', {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Cookie": cookies
      },
      body: JSON.stringify(olapBody)
    })
    .then(response => response.json())
    .then(data => {
			console.log('data', data);
			if (data.data) {
				fetchId = data.data;
			}
			return res.json(data)
		}
			)
    .catch(error => {
      res.status(500).json({ error: true, message: 'An error occurred while processing your request', details: error.message });
    });
  });
});

app.post('/olap', async (req, res) => {
	// const token = req.headers.authorization;

	console.log("fetchId", fetchId);

	import('node-fetch').then(fetch => {
		fetch.default(`https://bagel-lounge-co.syrve.app/api/olap/fetch/${fetchId}/json`, {
			method: 'POST',
			headers: {
				"Authorization": `Bearer ${token}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify(olapBody)
		})
		.then(response => {
			return response.json();
		})
		.then(data => {
			console.log('::::fff', data);
			return res.json(data);
		})
		.catch(error => {
			res.status(500).json({ error: true, message: 'Произошла ошибка при обработке вашего запроса', details: error.message });
		});
	}
	);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
