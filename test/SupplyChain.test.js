const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain", function () {
  let supplyChain;
  let owner, manufacturer, supplier, distributor, retailer, unknown;

  beforeEach(async function () {
    [owner, manufacturer, supplier, distributor, retailer, unknown] =
      await ethers.getSigners();

    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();

    // Register participants
    await supplyChain.registerParticipant(
      manufacturer.address,
      "Test Manufacturer",
      "manufacturer"
    );
    await supplyChain.registerParticipant(
      supplier.address,
      "Test Supplier",
      "supplier"
    );
    await supplyChain.registerParticipant(
      distributor.address,
      "Test Distributor",
      "distributor"
    );
    await supplyChain.registerParticipant(
      retailer.address,
      "Test Retailer",
      "retailer"
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await supplyChain.owner()).to.equal(owner.address);
    });

    it("Should register owner as participant", async function () {
      const participant = await supplyChain.getParticipant(owner.address);
      expect(participant.isActive).to.be.true;
      expect(participant.role).to.equal("admin");
    });
  });

  describe("Participant Management", function () {
    it("Should register a new participant", async function () {
      const participant = await supplyChain.getParticipant(
        manufacturer.address
      );
      expect(participant.name).to.equal("Test Manufacturer");
      expect(participant.role).to.equal("manufacturer");
      expect(participant.isActive).to.be.true;
    });

    it("Should reject duplicate registration", async function () {
      await expect(
        supplyChain.registerParticipant(
          manufacturer.address,
          "Duplicate",
          "manufacturer"
        )
      ).to.be.revertedWith("Already registered");
    });

    it("Should only allow owner to register participants", async function () {
      await expect(
        supplyChain
          .connect(manufacturer)
          .registerParticipant(unknown.address, "Test", "supplier")
      ).to.be.revertedWith("Only owner can perform this action");
    });

    it("Should deactivate a participant", async function () {
      await supplyChain.deactivateParticipant(manufacturer.address);
      const participant = await supplyChain.getParticipant(
        manufacturer.address
      );
      expect(participant.isActive).to.be.false;
    });
  });

  describe("Product Creation", function () {
    it("Should create a product successfully", async function () {
      const tx = await supplyChain
        .connect(manufacturer)
        .createProduct(
          "Test Product",
          "SKU-001",
          "China",
          "Factory A",
          "22.5431",
          "114.0579"
        );

      await expect(tx)
        .to.emit(supplyChain, "ProductCreated")
        .withArgs(1, "Test Product", "SKU-001", manufacturer.address, (await ethers.provider.getBlock("latest")).timestamp);

      const product = await supplyChain.getProduct(1);
      expect(product.name).to.equal("Test Product");
      expect(product.sku).to.equal("SKU-001");
      expect(product.manufacturer).to.equal(manufacturer.address);
      expect(product.status).to.equal(0); // Created
    });

    it("Should reject duplicate SKU", async function () {
      await supplyChain
        .connect(manufacturer)
        .createProduct(
          "Test Product",
          "SKU-001",
          "China",
          "Factory A",
          "22.5431",
          "114.0579"
        );

      await expect(
        supplyChain
          .connect(manufacturer)
          .createProduct(
            "Another Product",
            "SKU-001",
            "Japan",
            "Factory B",
            "35.6762",
            "139.6503"
          )
      ).to.be.revertedWith("SKU already exists");
    });

    it("Should reject unregistered participants", async function () {
      await expect(
        supplyChain
          .connect(unknown)
          .createProduct(
            "Test Product",
            "SKU-002",
            "USA",
            "Factory C",
            "40.7128",
            "-74.0060"
          )
      ).to.be.revertedWith("Participant not registered or inactive");
    });

    it("Should create initial tracking event on product creation", async function () {
      await supplyChain
        .connect(manufacturer)
        .createProduct(
          "Test Product",
          "SKU-001",
          "China",
          "Factory A",
          "22.5431",
          "114.0579"
        );

      const history = await supplyChain.getTrackingHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0].location).to.equal("Factory A");
      expect(history[0].status).to.equal(0); // Created
    });
  });

  describe("Product Tracking", function () {
    beforeEach(async function () {
      await supplyChain
        .connect(manufacturer)
        .createProduct(
          "Test Product",
          "SKU-001",
          "China",
          "Factory A",
          "22.5431",
          "114.0579"
        );
    });

    it("Should update tracking successfully", async function () {
      const tx = await supplyChain
        .connect(supplier)
        .updateTracking(
          1,
          "Port of Shanghai",
          "Shipped",
          1,
          "31.2304",
          "121.4737"
        );

      await expect(tx).to.emit(supplyChain, "ProductTracked");

      const product = await supplyChain.getProduct(1);
      expect(product.status).to.equal(1); // InTransit
    });

    it("Should maintain full tracking history", async function () {
      await supplyChain
        .connect(supplier)
        .updateTracking(
          1,
          "Shanghai Port",
          "Loading",
          1,
          "31.2304",
          "121.4737"
        );
      await supplyChain
        .connect(distributor)
        .updateTracking(
          1,
          "Dubai Customs",
          "Customs",
          3,
          "25.2048",
          "55.2708"
        );
      await supplyChain
        .connect(retailer)
        .updateTracking(
          1,
          "Mumbai Warehouse",
          "Received",
          2,
          "19.0760",
          "72.8777"
        );

      const history = await supplyChain.getTrackingHistory(1);
      expect(history.length).to.equal(4); // 1 initial + 3 updates
    });

    it("Should not allow tracking recalled products", async function () {
      await supplyChain.recallProduct(1, "Quality issue");

      await expect(
        supplyChain
          .connect(supplier)
          .updateTracking(1, "Port", "Shipped", 1, "0", "0")
      ).to.be.revertedWith("Cannot track recalled product");
    });
  });

  describe("Product Recall", function () {
    beforeEach(async function () {
      await supplyChain
        .connect(manufacturer)
        .createProduct(
          "Test Product",
          "SKU-001",
          "China",
          "Factory A",
          "22.5431",
          "114.0579"
        );
    });

    it("Should recall a product", async function () {
      const tx = await supplyChain.recallProduct(1, "Safety issue found");
      await expect(tx).to.emit(supplyChain, "ProductRecalled").withArgs(1, "Safety issue found");

      const product = await supplyChain.getProduct(1);
      expect(product.status).to.equal(5); // Recalled
    });

    it("Should only allow owner to recall products", async function () {
      await expect(
        supplyChain.connect(manufacturer).recallProduct(1, "Test recall")
      ).to.be.revertedWith("Only owner can perform this action");
    });
  });

  describe("Product Verification", function () {
    beforeEach(async function () {
      await supplyChain
        .connect(manufacturer)
        .createProduct(
          "Test Product",
          "SKU-001",
          "China",
          "Factory A",
          "22.5431",
          "114.0579"
        );
    });

    it("Should verify authentic product by SKU", async function () {
      const [isValid, productId] = await supplyChain.verifyProduct("SKU-001");
      expect(isValid).to.be.true;
      expect(productId).to.equal(1);
    });

    it("Should reject counterfeit product SKU", async function () {
      const [isValid, productId] = await supplyChain.verifyProduct(
        "FAKE-SKU-999"
      );
      expect(isValid).to.be.false;
      expect(productId).to.equal(0);
    });
  });

  describe("Product Count", function () {
    it("Should track product count accurately", async function () {
      expect(await supplyChain.productCount()).to.equal(0);

      await supplyChain
        .connect(manufacturer)
        .createProduct("P1", "SKU-1", "CN", "Loc1", "0", "0");
      expect(await supplyChain.productCount()).to.equal(1);

      await supplyChain
        .connect(manufacturer)
        .createProduct("P2", "SKU-2", "JP", "Loc2", "0", "0");
      expect(await supplyChain.productCount()).to.equal(2);
    });
  });
});
