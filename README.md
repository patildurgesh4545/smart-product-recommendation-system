# TechScout India

TechScout India is a product discovery and recommendation web application designed to help users explore, search, compare, and evaluate electronic products available in the Indian market.

The application uses product dataset information to make product discovery easier and help users make informed purchasing decisions.

## Features

- **Product Discovery:** Browse electronic products using the available product catalogue.
- **Product Search:** Find products by name and available search criteria.
- **Category Filtering:** Explore products using supported categories and filters.
- **Product Details:** View available product information, prices, discounts, ratings, and other dataset attributes.
- **Product Comparison:** Compare available product information to evaluate different options.
- **Product Recommendations:** Discover products based on the application's supported recommendation logic.
- **Responsive Interface:** Access the application through a web browser on supported desktop and mobile screen sizes.

## Technology Stack

- **Backend:** Python and Flask
- **Data Processing:** Pandas
- **Frontend:** HTML, CSS, and JavaScript
- **Templating:** Jinja2
- **Dataset:** Amazon India product data in CSV format

## Project Structure

```text
techscout-india/
├── app.py
├── requirements.txt
├── data/
│   └── amazon.csv
├── templates/
├── static/
├── .venv/
└── README.md
```

The `.venv/` directory is created locally when setting up the Python environment. It does not need to be committed to version control.

## Prerequisites

Before running the application, install:

- Python 3.10 or a compatible version supported by the project dependencies
- Visual Studio Code (recommended)
- The Python extension for Visual Studio Code

## Installation and Setup

### 1. Download the Project

Extract the project ZIP file into your preferred directory.

Open the extracted project folder in Visual Studio Code.

Ensure that the terminal is opened in the directory containing `app.py` and `requirements.txt`.

If the project contains a nested `techscout-india` directory, enter that directory before continuing.

### 2. Open the VS Code Terminal

Select:

**Terminal → New Terminal**

### 3. Create a Virtual Environment

Run:

```powershell
python -m venv .venv
```

### 4. Activate the Virtual Environment

For Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks script execution, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then activate the environment again.

### 5. Install Dependencies

Run:

```powershell
python -m pip install --upgrade pip
```

Install the project dependencies:

```powershell
python -m pip install -r requirements.txt
```

### 6. Run the Application

Start the Flask development server:

```powershell
python app.py
```

### 7. Open the Application

Once the server starts successfully, open your browser and visit:

http://127.0.0.1:5000

Keep the terminal running while using the application.

To stop the development server, press `Ctrl + C`.

## Dataset

The application uses a CSV product dataset located at:

`data/amazon.csv`

The dataset provides the product information used by the application. The exact fields and available records depend on the supplied dataset.

Ensure that the CSV file exists at the expected path before starting the application.

## Configuration

The application supports the following optional environment variable:

`## Contact & Connect

For questions, suggestions, bug reports, or collaboration opportunities related to TechScout India, feel free to connect with me.

- **Email:** khelwadeom@gmail.com
- **LinkedIn:** [Om Khelwade](https://www.linkedin.com/in/om-khelwade-3303ok)
- **GitHub:** [khelwadeom-rgb](https://github.com/khelwadeom-rgb)
- **GeeksforGeeks:** [My Profile](https://www.geeksforgeeks.org/profile/khelwadeom33?tab=overview)

### Feedback and Contributions

If you find an issue or have an idea to improve TechScout India, you can contact me by email or connect through GitHub.

Suggestions, feedback, and opportunities to collaborate on improving the application are welcome.

## Troubleshooting

### Flask Import Error

If VS Code reports that Flask cannot be imported, install the dependencies using the Python interpreter selected for the project:

```powershell
python -m pip install -r requirements.txt
```

Also select `.venv\Scripts\python.exe` through **Python: Select Interpreter** in VS Code.

### Requirements File Not Found

If you see an error indicating that `requirements.txt` cannot be found, check your current directory:

```powershell
Get-Location
Get-ChildItem
```

Navigate to the folder containing `requirements.txt` and `app.py`.

### Application File Not Found

If Python cannot find `app.py`, locate it using:

```powershell
Get-ChildItem -Recurse -Filter app.py
```

Navigate to the directory containing the file before running the application.

### Dataset Not Found

Verify that the expected CSV file exists:

```powershell
Test-Path .\data\amazon.csv
```

If the result is `False`, check the dataset location and the path configured in the application.

### Port Already in Use

If port 5000 is occupied, stop the other development server or configure the Flask application to use another available port.

## Development Notes

- Use a virtual environment to isolate project dependencies.
- Keep the dataset in the expected location.
- Do not commit virtual environments, local secrets, or private configuration files.
- Use Flask's development server only for local development, not production deployment.
- Verify product data quality and availability before relying on displayed information.

## Future Improvements

Potential enhancements include:

- Improved product filtering and sorting.
- More advanced personalized recommendation methods.
- Additional comparison criteria.
- Better dataset validation and cleaning.
- Improved accessibility and mobile usability.
- Automated tests for backend routes and recommendation logic.

## Contact & Connect

For questions, suggestions, bug reports, or collaboration opportunities related to TechScout India, feel free to connect with me.

- **Email:** khelwadeom@gmail.com
- **LinkedIn:** [Om Khelwade](https://www.linkedin.com/in/om-khelwade-3303ok)
- **GitHub:** [khelwadeom-rgb](https://github.com/khelwadeom-rgb)

### Feedback and Contributions

If you find an issue or have an idea to improve TechScout India, you can contact me by email or connect through GitHub.

Suggestions, feedback, and opportunities to collaborate on improving the application are welcome.


## License

No license has been specified for this project. Add an appropriate license before distributing or reusing the source code publicly.

## Disclaimer

TechScout India is intended to support product discovery and comparison. Product information, prices, ratings, discounts, and other attributes depend on the supplied dataset and may not reflect current marketplace listings. Verify current information with the relevant seller before making a purchase.
# smart-product-recommendation-system
