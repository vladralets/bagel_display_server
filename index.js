const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.post("/init-olap-report", async (req, res) => {
  const olapBody = (dateFrom, dateTo) => {
    return {
      olapType: "SALES",
      categoryFields: [],
      groupFields: ["GuestNum", "OrderNum", "CashRegisterName", "OrderType"],
      stackByDataFields: false,
      dataFields: [],
      calculatedFields: [
        {
          name: "DishDiscountSumInt",
          title: "Sales",
          formula: "[DishDiscountSumInt]",
          type: "MONEY",
        },
      ],
      filters: [
        {
          field: "OpenDate.Typed",
          filterType: "date_range",
          dateFrom: dateFrom,
          dateTo: dateTo,
          valueMin: null,
          valueMax: null,
          valueList: [],
          includeLeft: true,
          includeRight: false,
          inclusiveList: true,
        },
      ],
      includeVoidTransactions: false,
      includeNonBusinessPaymentTypes: false,
    };
  };

  try {
    const { login, password, dateFrom, dateTo } = req.body;
    const reqBody = olapBody(dateFrom, dateTo);
    const nodeFetch = await import("node-fetch");
    const authResponse = await nodeFetch.default(
      "https://bagel-lounge-co.syrve.app/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      }
    );

    if (!authResponse.ok) throw new Error(`Error: ${authResponse.status}`);

    const { token } = await authResponse.json();
    const cookies = authResponse.headers.raw()["set-cookie"];

    const initResponse = await nodeFetch.default(
      "https://bagel-lounge-co.syrve.app/api/olap/init",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Cookie: cookies,
        },
        body: JSON.stringify(reqBody),
      }
    );

    const { data: fetchId } = await initResponse.json();

    const checkStatus = async () => {
      const statusResponse = await nodeFetch.default(
        `https://bagel-lounge-co.syrve.app/api/olap/fetch-status/${fetchId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Cookie: cookies,
          },
        }
      );

      const status = await statusResponse.json();
      return status;
    };

    let status = await checkStatus();
    while (status.data !== "SUCCESS") {
      if (status.data === "ERROR") {
        throw new Error("OLAP processing failed");
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      status = await checkStatus();
    }

    const finalResponse = await nodeFetch.default(
      `https://bagel-lounge-co.syrve.app/api/olap/fetch/${fetchId}/json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Cookie: cookies,
        },
        body: JSON.stringify(reqBody),
      }
    );

    const finalData = await finalResponse.json();
    console.log({
      path: "/init-olap-report",
      dateFrom,
      dateTo,
      res: finalData.result.rawData,
      whoAmI: "My name is Vlad, more known as @sipur_belev",
    });
    res.json({
      ...finalData,
      whoAmI: "My name is Vlad, more known as @sipur_belev",
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "An error occurred while processing your request",
      details: error.message,
    });
  }
});

app.post("/get-items", async (req, res) => {
  const olapBody = (dateFrom, dateTo) => {
    return {
      olapType: "SALES",
      categoryFields: [],
      groupFields: [
        "GuestNum",
        "OrderType",
        "DishCategory",
        "DishCode",
        "DishName",
      ],
      stackByDataFields: false,
      dataFields: [],
      calculatedFields: [
        {
          name: "DishDiscountSumInt",
          title: "Sales",
          formula: "[DishDiscountSumInt]",
          type: "MONEY",
        },
        {
          name: "OrderItems",
          title: "Products",
          formula: "[OrderItems]",
        },
      ],
      filters: [
        {
          field: "OpenDate.Typed",
          filterType: "date_range",
          dateFrom: dateFrom,
          dateTo: dateTo,
          valueMin: null,
          valueMax: null,
          valueList: [],
          includeLeft: true,
          includeRight: false,
          inclusiveList: true,
        },
      ],
      includeVoidTransactions: false,
      includeNonBusinessPaymentTypes: false,
    };
  };

  try {
    const { login, password, dateFrom, dateTo } = req.body;
    const reqBody = olapBody(dateFrom, dateTo);
    const nodeFetch = await import("node-fetch");
    const authResponse = await nodeFetch.default(
      "https://bagel-lounge-co.syrve.app/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      }
    );

    if (!authResponse.ok) throw new Error(`Error: ${authResponse.status}`);

    const { token } = await authResponse.json();
    const cookies = authResponse.headers.raw()["set-cookie"];

    const initResponse = await nodeFetch.default(
      "https://bagel-lounge-co.syrve.app/api/olap/init",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Cookie: cookies,
        },
        body: JSON.stringify(reqBody),
      }
    );

    const { data: fetchId } = await initResponse.json();

    const checkStatus = async () => {
      const statusResponse = await nodeFetch.default(
        `https://bagel-lounge-co.syrve.app/api/olap/fetch-status/${fetchId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Cookie: cookies,
          },
        }
      );

      const status = await statusResponse.json();
      return status;
    };

    let status = await checkStatus();
    while (status.data !== "SUCCESS") {
      if (status.data === "ERROR") {
        throw new Error("OLAP processing failed");
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      status = await checkStatus();
    }

    const finalResponse = await nodeFetch.default(
      `https://bagel-lounge-co.syrve.app/api/olap/fetch/${fetchId}/json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Cookie: cookies,
        },
        body: JSON.stringify(reqBody),
      }
    );

    const finalData = await finalResponse.json();
    console.log({
      path: "/get-items",
      dateFrom,
      dateTo,
      finalData,
      whoAmI: "My name is Vlad, more known as @sipur_belev",
    });
    res.json({
      ...finalData,
      whoAmI: "Get items, and my name is Vlad, more known as @sipur_belev",
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "An error occurred while processing your request",
      details: error.message,
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
