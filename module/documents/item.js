export class Anime5eItem extends Item {
    prepareData() {
        super.prepareData();

        const itemData = this.data;
        const data = itemData.data;
        const flags = itemData.flags;

        // Handle different item types
        switch (itemData.type) {
            case 'weapon':
                this._prepareWeaponData(itemData);
                break;
            case 'armor':
                this._prepareArmorData(itemData);
                break;
            case 'power':
                this._preparePowerData(itemData);
                break;
        }
    }

    _prepareWeaponData(itemData) {
        const data = itemData.data;
        
        // Calculate attack bonus
        if (data.weaponType === 'melee') {
            data.attackBonus = data.bonus ?? 0;
        } else if (data.weaponType === 'ranged') {
            data.attackBonus = data.bonus ?? 0;
        }

        // Calculate damage
        if (!data.damage) data.damage = '';
        if (data.damage && data.damageType) {
            data.damageString = `${data.damage} ${data.damageType}`;
        }
    }

    _prepareArmorData(itemData) {
        const data = itemData.data;
        
        // Calculate final AC
        data.ac.value = data.ac.base + (data.ac.bonus ?? 0);
    }

    _preparePowerData(itemData) {
        const data = itemData.data;
        
        // Calculate power DC
        if (data.saveRequired) {
            data.dc = 8 + data.dcBonus;
        }

        // Format power cost
        if (data.mpCost) {
            data.mpCostString = `${data.mpCost} MP`;
        }
    }

    getRollData() {
        const data = super.getRollData();
        const itemData = this.data.data;

        // Add custom roll data for weapons
        if (this.type === 'weapon') {
            data.attackBonus = itemData.attackBonus;
        }

        return data;
    }
} 