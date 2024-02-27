const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

let userCookies;

// const formatDate = (date) => {
//   const year = date.getFullYear();
//   const month = (`0${date.getMonth() + 1}`).slice(-2);
//   const day = (`0${date.getDate()}`).slice(-2);
//   return `${year}-${month}-${day}`;
// };

// const getTodayRange = () => {
//   const today = new Date();
//   const dateFrom = `${formatDate(today)}T00:00:00`;
//   const dateTo = `${formatDate(today)}T23:59:00`;
//   return { dateFrom, dateTo };
// };

// const { dateFrom, dateTo } = getTodayRange();

// const olapBody = (dateFrom, dateTo) => ({
//   "olapType": "SALES",
//   "categoryFields": [],
//   "groupFields": ["GuestNum", "OrderNum", "CashRegisterName"],
//   "stackByDataFields": false,
//   "dataFields": [],
//   "calculatedFields": [{
//     "name": "DishDiscountSumInt",
//     "title": "Sales",
//     "formula": "[DishDiscountSumInt]",
//     "type": "MONEY"
//   }],
//   "filters": [{
//     "field": "OpenDate.Typed",
//     "filterType": "date_range",
//     "dateFrom": dateFrom,
//     "dateTo": dateTo,
//     "valueMin": null,
//     "valueMax": null,
//     "valueList": [],
//     "includeLeft": true,
//     "includeRight": false,
//     "inclusiveList": true
//   }],
//   "includeVoidTransactions": false,
//   "includeNonBusinessPaymentTypes": false
// });

app.post('/init-olap-report', async (req, res) => {
	const formatDate = (date) => {
		const year = date.getFullYear();
		const month = (`0${date.getMonth() + 1}`).slice(-2);
		const day = (`0${date.getDate()}`).slice(-2);
		return `${year}-${month}-${day}`;
	};

	const getTodayRange = () => {
		const today = new Date();
		const dateFrom = `${formatDate(today)}T00:00:00`;
		const dateTo = `${formatDate(today)}T23:59:00`;
		return { dateFrom, dateTo };
	};
	
	const { dateFrom, dateTo } = getTodayRange();
	
	const olapBody = (dateFrom, dateTo) => ({
		"olapType": "SALES",
		"categoryFields": [],
		"groupFields": ["GuestNum", "OrderNum", "CashRegisterName"],
		"stackByDataFields": false,
		"dataFields": [],
		"calculatedFields": [{
			"name": "DishDiscountSumInt",
			"title": "Sales",
			"formula": "[DishDiscountSumInt]",
			"type": "MONEY"
		}],
		"filters": [{
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
		}],
		"includeVoidTransactions": false,
		"includeNonBusinessPaymentTypes": false
	});
  const reqBody = olapBody(dateFrom, dateTo);
	
	console.log('reqBody', reqBody.filters[0].dateFrom, reqBody.filters[0].dateTo);
  try {
    const { login, password } = req.body;
    const nodeFetch = await import('node-fetch');
    const authResponse = await nodeFetch.default('https://bagel-lounge-co.syrve.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });

    if (!authResponse.ok) throw new Error(`Error: ${authResponse.status}`);

    const { token } = await authResponse.json();
    const cookies = authResponse.headers.raw()['set-cookie'];

    const initResponse = await nodeFetch.default('https://bagel-lounge-co.syrve.app/api/olap/init', {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Cookie": cookies
      },
      body: JSON.stringify(reqBody)
    });

    const { data: fetchId } = await initResponse.json();

    const checkStatus = async () => {
      const statusResponse = await nodeFetch.default(`https://bagel-lounge-co.syrve.app/api/olap/fetch-status/${fetchId}`, {
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Cookie": cookies
        },
      });

      const status = await statusResponse.json();
      return status;
    };

    let status = await checkStatus();
		console.log('status', status);
    while (status.data !== "SUCCESS") {
			console.log('status in while', status);
      if (status.data === "ERROR") {
        throw new Error('OLAP processing failed');
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
      status = await checkStatus();
			console.log('status after waiting', status);
    }

    const finalResponse = await nodeFetch.default(`https://bagel-lounge-co.syrve.app/api/olap/fetch/${fetchId}/json`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Cookie": cookies
      },
			body: JSON.stringify(reqBody)
    });

    const finalData = await finalResponse.json();

    res.json({...finalData, reqBody});
  } catch (error) {
    res.status(500).json({ error: true, message: 'An error occurred while processing your request', details: error.message });
  }
});


// app.post('/get-olap-report', async (req, res) => {
// 	const token = req.body.token;
// 	const fetchId = req.body.fetchId;
// 	const olapBody = req.body.olapBody;

// 	console.log("fetchId", fetchId);

// 	import('node-fetch').then(fetch => {
// 		fetch.default(`https://bagel-lounge-co.syrve.app/api/olap/fetch/${fetchId}/json`, {
// 			method: 'POST',
// 			headers: {
// 				"Authorization": `Bearer ${token}`,
// 				"Content-Type": "application/json"
// 			},
// 			body: JSON.stringify(olapBody)
// 		})
// 		.then(response => {
// 			return response.json();
// 		})
// 		.then(data => {
// 			return res.json(data);
// 		})
// 		.catch(error => {
// 			res.status(500).json({ error: true, message: 'Произошла ошибка при обработке вашего запроса', details: error.message });
// 		});
// 	}
// 	);
// });

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});