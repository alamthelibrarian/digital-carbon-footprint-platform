# DPC v1.0 regression fixtures

The regression test in `../index.test.mjs` uses a small synthetic dataset entered into a working copy of the source DPC v1.0 workbook and recalculated with LibreOffice Calc.

## Fixture inputs and workbook outputs

| Calculation area | Input highlights | Recalculated workbook output |
|---|---|---:|
| On Premise | 100 W idle, 200 W max, 50% utilisation, 10 TB storage at 0.5 Wh/TBh, PUE 1.5, UK grid factor 0.20705 | 2,036.7 kWh/year; 421.698735 kgCO2e |
| Networking | 1,000 MB/day transmitted, 500 MB/day received, 0.0065 kWh/GB, grid factor 0.45 | 0.133453125 kgCO2e |
| Website Use | 100 KB page size, 10,000 visits, 5 MB download, 1,000 downloads, 0.0065/0.1 kWh/GB, grid factor 0.45 | 0.143775 kgCO2e |
| In Cloud | 10 kgCO2e data centres/servers and 5 kgCO2e networking | 15 kgCO2e |
| Travel | 0.25 tCO2e | 250 kgCO2e |

The expected aggregate is **686.975963125 kgCO2e**.

## Important limitation

This fixture verifies representative row-level calculations and aggregation. Some workbook subtotal/summary formulas use Excel structured references and were not suitable for treating every LibreOffice-rendered subtotal cell as authoritative. The regression fixture therefore compares the individual recalculated outputs and the independently summed expected total. A further review using Microsoft Excel or another compatible calculation engine is still required before the DPC implementation can be described as validated.

The synthetic fixture values are test data, not emission-factor recommendations. The UK grid factor and Datasheet assumptions are used only to reproduce this controlled example.
