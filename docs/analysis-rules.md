# Analysis rules

The engine applies these rules in order after one direct `OBSERVED` claim per source record. A separate H-01 hypothesis is generated from the first error/failure record when present. No rule alone proves causation.

| ID | Pattern | Output |
|---|---|---|
| R-01 | Deployment then error log within 15 min | Root-cause candidate, refused without causal corroboration |
| R-02 | Failed CI then deployment within 60 min | INFERRED relation |
| R-03 | Two CI records name same dependency with different versions | INFERRED version disagreement |
| R-04 | Memory/disk usage above 90% then error within 15 min | Root-cause candidate, refused without causal corroboration |
| R-05 | Three service-labelled error logs within 5 min | INFERRED error cluster, propagation unknown |
| R-06 | Deployment record has `event: rollback` | OBSERVED rollback record |
| R-07 | Git commit precedes CI record within 10 min | INFERRED relation (Kiro design mislabels this OBSERVED) |

The verifier caps HYPOTHESIS confidence at 0.5. Confidence is a deterministic evidence-to-gap ratio, not a calibrated probability.
