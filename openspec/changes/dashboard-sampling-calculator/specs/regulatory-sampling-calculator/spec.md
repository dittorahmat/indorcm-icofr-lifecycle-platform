## ADDED Requirements

### Requirement: Dynamic Grouping of Controls by Frequency
The dashboard realization widget SHALL automatically query all active controls from the database and group them by their frequency property:
- **Frequencies**: Annual (Tahunan), Quarterly (Kuartalan), Monthly (Bulanan), Weekly (Mingguan), Daily (Harian), Ad-hoc (Berdasarkan Kejadian), and Automated (Otomatis).

#### Scenario: Aggregate control counts
- **WHEN** the dashboard page loads
- **THEN** the widget SHALL calculate the total population of controls for each frequency group.

---

### Requirement: Display BUMN SK-5 Table 22 Target Benchmarks
For each frequency group, the table widget SHALL display the static sample target range mandated by BUMN SK-5 Table 22:
- Annual: "1"
- Quarterly: "2 - 3"
- Monthly: "2 - 5"
- Weekly: "5 - 15"
- Daily: "15 - 40"
- Ad-hoc: "30 - 60"
- Automated: "1"

#### Scenario: Show Table 22 benchmark for Monthly controls
- **WHEN** the widget displays the "Monthly" (Bulanan) frequency row
- **THEN** the target column SHALL render "2 - 5" as the mandated sample range.

---

### Requirement: Calculate and Display CSA Realization
The widget SHALL calculate how many controls in each frequency group have completed their Control Self-Assessment (CSA) or testing:
- **Realisasi**: Display as "Completed CSA / Total Controls" (e.g., "8 / 10").
- **Visual Progress**: Render a completion bar and percentage for each row.
- Fully localized (English and Indonesian).

#### Scenario: Display 80% progress for Monthly controls
- **WHEN** 8 out of 10 monthly controls have completed CSA records
- **THEN** the realization column SHALL display "8 / 10" and show a progress indicator at "80%".
