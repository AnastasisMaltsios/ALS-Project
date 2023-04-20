// const buttonGroups = document.querySelectorAll('.button-group');
// const calculateButton = document.querySelector('#calculate');
// const resultDiv = document.querySelector('#result');

// calculateButton.addEventListener('click', () => {
//   let totalSum = 0;
//   buttonGroups.forEach((buttonGroup, index) => {
//     let sum = 0;
//     buttonGroup.querySelectorAll('button').forEach((button) => {
//       if (button.classList.contains('selected')) {
//         sum += parseInt(button.value);
//       }
//     });
//     totalSum += sum * Math.pow(10, index);
//   });
//   resultDiv.textContent = `Total number: ${totalSum}`;

//   // Send the result to the server
//   fetch('/survey', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({ totalSum })
//   })
//   .then(response => response.json())
//   .then(data => console.log(data))
//   .catch(error => console.error(error));
// });

// buttonGroups.forEach((buttonGroup) => {
//   buttonGroup.querySelectorAll('button').forEach((button) => {
//     button.addEventListener('click', () => {
//       button.classList.toggle('selected');
//     });
//   });
// });
// let outputNumber = 0;
// const countBtns = document.querySelectorAll('.count-btn');


// countBtns.forEach(btn => {
//   btn.addEventListener('click', () => {
//     const value = parseInt(btn.value);
//     outputNumber += value;
//     console.log(outputNumber);
//   });
// });