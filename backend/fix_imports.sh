#!/bin/bash
cd ~/Bureau/DouaneGestion/backend

# Vérifier et corriger situation_cheque.py
if grep -q "class SituationCheque" app/models/situation_cheque.py; then
    echo "✅ SituationCheque déjà correct"
else
    echo "🔧 Correction de situation_cheque.py..."
    sed -i 's/class cheque:/class SituationCheque:/g' app/models/situation_cheque.py
    sed -i 's/class Cheque:/class SituationCheque:/g' app/models/situation_cheque.py
fi

# Vérifier et corriger situation_virement.py
if grep -q "class SituationVirement" app/models/situation_virement.py; then
    echo "✅ SituationVirement déjà correct"
else
    echo "🔧 Correction de situation_virement.py..."
    sed -i 's/class virement:/class SituationVirement:/g' app/models/situation_virement.py
    sed -i 's/class Virement:/class SituationVirement:/g' app/models/situation_virement.py
fi

# Tester les imports
echo ""
echo "=== Test des imports ==="
python -c "from app.models import SituationCheque, SituationVirement; print('✅ Import réussi !')"

echo ""
echo "=== Lancement du seed ==="
python app/seed_data.py --update

