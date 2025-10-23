const form = document.getElementById("addItemForm");
const tableBody = document.querySelector("#inventoryTable tbody");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("itemName").value.trim();
  const category = document.getElementById("itemCategory").value;
  const qty = parseInt(document.getElementById("itemQuantity").value);
  const price = parseFloat(document.getElementById("itemPrice").value) || 0;
  const reorder = parseInt(document.getElementById("itemReorder").value);
  const supplier = document.getElementById("itemSupplier").value.trim();

  let status = "Available";
  if (qty <= reorder) status = "Critical";
  else if (qty <= reorder + 2) status = "Almost";
  else if (qty <= reorder + 5) status = "Available";
  else status = "Surplus";

  const totalValue = (qty * price).toFixed(2);

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${name}</td>
    <td>${category}</td>
    <td>${qty}</td>
    <td>₱${price.toFixed(2)}</td>
    <td>₱${totalValue}</td>
    <td><span class="status ${status}">${status}</span></td>
    <td>${supplier || "N/A"}</td>
  `;

  const noData = document.querySelector(".no-data");
  if (noData) noData.remove();

  tableBody.appendChild(row);
  form.reset();
});

searchInput.addEventListener("keyup", () => {
  const filter = searchInput.value.toLowerCase();
  const rows = tableBody.querySelectorAll("tr");
  rows.forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(filter)
      ? ""
      : "none";
  });
});


filterStatus.addEventListener("change", () => {
  const selected = filterStatus.value;
  const rows = tableBody.querySelectorAll("tr");
  rows.forEach((row) => {
    const status = row.querySelector(".status")?.textContent;
    row.style.display =
      selected === "all" || status === selected ? "" : "none";
  });
});
