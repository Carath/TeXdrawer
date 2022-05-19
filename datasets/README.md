# Datasets


## hwrt

- symbols.csv
- test-data.csv (17074 samples, 131 MB)
- train-data.csv (151159 samples, 1.2 GB)

Link: <http://www.martin-thoma.de/write-math/data>


## detexify

- detexify.sql (210454 samples, 1.0 GB)
- symbols.txt

Link: <https://github.com/kirel/detexify-data>

Note that some latex commands of Detexify symbols have some issues in the dataset. The ``` extractLatexCommand_detexify() ``` function takes care of this:
- ``` \\ ``` vs ``` \_ ```
- ``` \not_sim ``` vs ``` \not\sim ```
- ``` \not_approx ``` vs ``` \not\approx ```
- ``` \not_equiv ``` vs ``` \not\equiv ```
- ``` \not_simeq ``` vs ``` \not\simeq ```
