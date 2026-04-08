function renderTable(data, columns) {
  const tableEle = document.getElementsByTagName("table")[0];

  //Clear table cũ
  tableEle.innerHTML = "";

  // THEAD
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  columns.forEach((col) => {
    const th = document.createElement("th");
    th.innerText = col.title;
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  tableEle.appendChild(thead);

  // TBody
  const tbody = document.createElement("tbody");

  if (!Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">Không tìm thấy dữ liệu!</td></tr>`;
    tableEle.append(tbody);
    return;
  }

  const rows = data
    .map((item) => {
      const tds = columns.map((col) => `<td>${col.render(item)}</td>`).join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  tbody.innerHTML = rows;
  tableEle.appendChild(tbody);
}

// Columns

const columns = [
  {
    title: "Khách hàng",
    render: (item) => {
      const nameParts = item.name.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];

      return `
        <div class="cust-info">
          <div class="avatar" style="background:#ebf5fb;color:#3498db">
            ${firstName[0] + lastName[0]}
          </div>
          <div>
            <strong>${firstName + " " + lastName}</strong><br />
            <small>ID: ${item?.id}</small>
          </div>
        </div>
      `;
    },
  },

  {
    title: "Liên hệ",
    render: (item) => `
      ${item?.email}<br />
      <small>${item?.phone}</small>
    `,
  },

  {
    title: "Hạng",
    render: (item) => {
      let rank = "Đồng";
      let rankClass = "bronze";

      if (item.rank === "GOLD") {
        rank = "Vàng";
        rankClass = "gold";
      } else if (item.rank === "SILVER") {
        rank = "Bạc";
        rankClass = "silver";
      }

      return `<span class="tier ${rankClass}">${rank}</span>`;
    },
  },

  {
    title: "Đơn hàng",
    render: () => `25`,
  },

  {
    title: "Tổng chi tiêu",
    render: (item) => `<strong>${item?.totalSpending ?? 0}đ</strong>`,
  },

  {
    title: "Thao tác",
    render: () => `
      <button class="btn-action"><i class="fas fa-history"></i></button>
      <button class="btn-action"><i class="fas fa-user-edit"></i></button>
    `,
  },
];

// function fetch data table

async function getData(url, token) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Lỗi khi gọi API");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}

async function init() {
  const url =
    "https://k305jhbh09.execute-api.ap-southeast-1.amazonaws.com/customers";
  const token =
    "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJrMTgtc3RvcmUiLCJzdWIiOiIxIiwiZXhwIjoxNzc1MDExMTU0LCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzc1MDEwNTU0LCJlbWFpbCI6ImJhbmd0eEB0ZXN0LmNvbSJ9.KmfEsguDIuPjRzL_ns7pC4lJfgPkd_6Nf2RkUb-NVpU";
  const data = await getData(url, token);
  renderTable(data, columns);
}

init();
