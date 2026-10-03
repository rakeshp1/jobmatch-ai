const SAMPLE_JOBS = [
  {
    title: 'Senior Data Engineer',
    company: 'Northstar Labs',
    applicationUrl: 'https://example.com/jobs/northstar-senior-data-engineer',
    description: `Northstar Labs builds the warehouse and lake that product, finance, and operations all share. We are hiring a Senior Data Engineer to own batch and streaming data pipelines from ingestion through trusted KPI dashboards.

Responsibilities
- Design data pipelines in Python and SQL that land clickstream and operational data in Snowflake.
- Build Apache Spark and PySpark jobs on AWS, including EMR and S3, with Docker for repeatable runtime images.
- Orchestrate workflows in Apache Airflow and model the warehouse with dbt, including incremental models and data quality tests.
- Lead data modeling for star schema marts, data warehousing performance, and documented ETL into curated tables.
- Partner with analytics on Tableau extracts, code review, CI/CD, and production support when a pipeline misses its window.
- Use Git and Linux day to day, and keep batch processing and streaming data paths observable.

Requirements
- 5+ years of experience as a data engineer shipping production data pipelines.
- Hands-on Python, SQL, Spark, Airflow, dbt, Snowflake, and AWS.
- Practical data modeling, ETL, data warehousing, and data quality judgment.
- Comfort with Docker, Git, CI/CD, S3, and stakeholder communication.
- A bachelor's degree in a quantitative or engineering field, or equivalent practical experience.

Preferred
- Kafka for event ingestion, Terraform for infrastructure as code, and mentoring other engineers.
- Familiarity with Redshift or EMR is useful, as is a habit of writing unit testing around transformations.`,
  },
  {
    title: 'Azure Data Engineer',
    company: 'Contoso Health',
    applicationUrl: 'https://example.com/jobs/contoso-azure-data-engineer',
    description: `Contoso Health is modernizing the analytics estate that clinical operations and finance share. The Azure Data Engineer will turn source extracts into a governed lakehouse the reporting layer can trust.

Responsibilities
- Build data pipelines that move claims, encounters, and reference data into curated zones.
- Model a data warehouse with clear contracts, data quality checks, and batch processing windows.
- Write Python and SQL transformations, including Spark jobs, for large daily loads.
- Support KPI dashboards and stakeholder communication when a feed is late or a definition changes.
- Document ETL decisions so the next analyst can trace a measure back to the source file.

Requirements
- 4+ years building data pipelines, ETL, data modeling, and data warehousing solutions.
- Strong Python, SQL, and Spark, plus a working sense for data quality.
- Experience explaining tradeoffs to clinical operations or another regulated audience.
- A bachelor's degree or equivalent practical experience.

Preferred
- Azure Data Factory for orchestration and Azure Databricks for PySpark development.
- Azure Synapse or Synapse Analytics SQL pools, ADLS Gen2, and Azure DevOps release pipelines.
- Power BI models on top of the warehouse, and any prior healthcare data work.`,
  },
  {
    title: 'Machine Learning Engineer',
    company: 'Helios AI',
    applicationUrl: 'https://example.com/jobs/helios-machine-learning-engineer',
    description: `Helios AI ships ranking and forecasting models into customer products. The Machine Learning Engineer owns the path from a trained model to a service other teams can call.

Responsibilities
- Productionize machine learning models with explicit feature contracts and rollback plans.
- Own model deployment, model monitoring, and the on-call note for drift or failed scoring jobs.
- Build feature engineering pipelines that stay consistent between training and live scoring.
- Work in Python with PyTorch or TensorFlow, and track runs so a promotion is reviewable.
- Collaborate with platform engineers on Kubernetes workloads and CI/CD for model services.

Requirements
- 4+ years in software or machine learning roles, with Python used for more than notebooks.
- Shipped model deployment, not only offline analysis. Kubernetes experience is required.
- PyTorch or TensorFlow, plus feature engineering and a point of view on model monitoring.
- Ability to explain failure modes to product partners.
- A bachelor's degree in a technical field, or equivalent practical experience.

Preferred
- MLflow or another experiment tracking tool, a feature store, and SQL strong enough to debug a training set.
- Spark for large feature pipelines, Docker, and REST APIs in front of a model.`,
  },
  {
    title: 'Data Scientist',
    company: 'Lumen Retail',
    applicationUrl: 'https://example.com/jobs/lumen-data-scientist',
    description: `Lumen Retail uses experimentation to decide what lands on the homepage, in email, and in the store app. The Data Scientist frames the question, builds the measurement, and writes the decision memo.

Responsibilities
- Design A/B testing and other online experiments with guardrail metrics and a pre-registered readout.
- Use statistics and hypothesis testing to tell a real effect from noise, including causal inference when a test is not clean.
- Analyze large tables with Python, SQL, and Pandas, and pressure-test data quality before a number is shared.
- Build the occasional predictive modeling baseline with scikit-learn when a rule is not enough.
- Present results with stakeholder communication that a merchandiser can act on, including what not to do.

Requirements
- 3+ years in analytics or data science, with Python, SQL, and Pandas used on real decisions.
- Demonstrated experimentation, A/B testing, and statistical analysis.
- Comfort with scikit-learn for baselines and with data warehousing concepts enough to find the right table.
- Clear writing and a bachelor's degree in a quantitative field, or equivalent practical experience.

Preferred
- Tableau or another business intelligence tool, machine learning beyond linear baselines, and retail or e-commerce domain experience.
- Spark is a plus when a dataset no longer fits in memory.`,
  },
];

module.exports = { SAMPLE_JOBS };
