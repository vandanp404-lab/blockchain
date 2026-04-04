// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SupplyChain
 * @dev Blockchain-based supply chain tracking system
 */
contract SupplyChain {
    address public owner;

    enum ProductStatus {
        Created,
        InTransit,
        AtWarehouse,
        InCustoms,
        Delivered,
        Recalled
    }

    struct Product {
        uint256 id;
        string name;
        string sku;
        string origin;
        address manufacturer;
        uint256 createdAt;
        ProductStatus status;
        bool exists;
    }

    struct TrackingEvent {
        uint256 productId;
        string location;
        string description;
        address handler;
        uint256 timestamp;
        ProductStatus status;
        string latitude;
        string longitude;
    }

    struct Participant {
        address addr;
        string name;
        string role; // "manufacturer", "supplier", "distributor", "retailer", "customs"
        bool isActive;
    }

    // Storage
    mapping(uint256 => Product) public products;
    mapping(uint256 => TrackingEvent[]) public trackingHistory;
    mapping(address => Participant) public participants;
    mapping(string => bool) public skuExists;

    uint256 public productCount;
    address[] public participantList;

    // Events
    event ProductCreated(
        uint256 indexed productId,
        string name,
        string sku,
        address indexed manufacturer,
        uint256 timestamp
    );

    event ProductTracked(
        uint256 indexed productId,
        string location,
        ProductStatus status,
        address indexed handler,
        uint256 timestamp
    );

    event ParticipantRegistered(
        address indexed addr,
        string name,
        string role
    );

    event ProductRecalled(uint256 indexed productId, string reason);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyRegistered() {
        require(
            participants[msg.sender].isActive,
            "Participant not registered or inactive"
        );
        _;
    }

    modifier productExists(uint256 _productId) {
        require(products[_productId].exists, "Product does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Register owner as participant
        participants[msg.sender] = Participant({
            addr: msg.sender,
            name: "System Admin",
            role: "admin",
            isActive: true
        });
        participantList.push(msg.sender);
    }

    /**
     * @dev Register a new supply chain participant
     */
    function registerParticipant(
        address _addr,
        string memory _name,
        string memory _role
    ) external onlyOwner {
        require(_addr != address(0), "Invalid address");
        require(!participants[_addr].isActive, "Already registered");

        participants[_addr] = Participant({
            addr: _addr,
            name: _name,
            role: _role,
            isActive: true
        });
        participantList.push(_addr);

        emit ParticipantRegistered(_addr, _name, _role);
    }

    /**
     * @dev Create a new product on the blockchain
     */
    function createProduct(
        string memory _name,
        string memory _sku,
        string memory _origin,
        string memory _initialLocation,
        string memory _latitude,
        string memory _longitude
    ) external onlyRegistered returns (uint256) {
        require(!skuExists[_sku], "SKU already exists");
        require(bytes(_name).length > 0, "Product name required");

        productCount++;
        uint256 newProductId = productCount;

        products[newProductId] = Product({
            id: newProductId,
            name: _name,
            sku: _sku,
            origin: _origin,
            manufacturer: msg.sender,
            createdAt: block.timestamp,
            status: ProductStatus.Created,
            exists: true
        });

        skuExists[_sku] = true;

        // Add initial tracking event
        trackingHistory[newProductId].push(
            TrackingEvent({
                productId: newProductId,
                location: _initialLocation,
                description: "Product created and registered on blockchain",
                handler: msg.sender,
                timestamp: block.timestamp,
                status: ProductStatus.Created,
                latitude: _latitude,
                longitude: _longitude
            })
        );

        emit ProductCreated(
            newProductId,
            _name,
            _sku,
            msg.sender,
            block.timestamp
        );

        return newProductId;
    }

    /**
     * @dev Update product tracking with new location and status
     */
    function updateTracking(
        uint256 _productId,
        string memory _location,
        string memory _description,
        ProductStatus _status,
        string memory _latitude,
        string memory _longitude
    ) external onlyRegistered productExists(_productId) {
        require(
            products[_productId].status != ProductStatus.Recalled,
            "Cannot track recalled product"
        );

        products[_productId].status = _status;

        trackingHistory[_productId].push(
            TrackingEvent({
                productId: _productId,
                location: _location,
                description: _description,
                handler: msg.sender,
                timestamp: block.timestamp,
                status: _status,
                latitude: _latitude,
                longitude: _longitude
            })
        );

        emit ProductTracked(
            _productId,
            _location,
            _status,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Recall a product
     */
    function recallProduct(
        uint256 _productId,
        string memory _reason
    ) external onlyOwner productExists(_productId) {
        products[_productId].status = ProductStatus.Recalled;

        trackingHistory[_productId].push(
            TrackingEvent({
                productId: _productId,
                location: "RECALL ISSUED",
                description: _reason,
                handler: msg.sender,
                timestamp: block.timestamp,
                status: ProductStatus.Recalled,
                latitude: "0",
                longitude: "0"
            })
        );

        emit ProductRecalled(_productId, _reason);
    }

    /**
     * @dev Get full tracking history for a product
     */
    function getTrackingHistory(
        uint256 _productId
    )
        external
        view
        productExists(_productId)
        returns (TrackingEvent[] memory)
    {
        return trackingHistory[_productId];
    }

    /**
     * @dev Get tracking history count
     */
    function getTrackingCount(
        uint256 _productId
    ) external view returns (uint256) {
        return trackingHistory[_productId].length;
    }

    /**
     * @dev Get product details
     */
    function getProduct(
        uint256 _productId
    ) external view productExists(_productId) returns (Product memory) {
        return products[_productId];
    }

    /**
     * @dev Get participant details
     */
    function getParticipant(
        address _addr
    ) external view returns (Participant memory) {
        return participants[_addr];
    }

    /**
     * @dev Get total participants count
     */
    function getParticipantCount() external view returns (uint256) {
        return participantList.length;
    }

    /**
     * @dev Verify product authenticity by SKU
     */
    function verifyProduct(string memory _sku) external view returns (bool, uint256) {
        for (uint256 i = 1; i <= productCount; i++) {
            if (
                keccak256(bytes(products[i].sku)) == keccak256(bytes(_sku)) &&
                products[i].exists
            ) {
                return (true, i);
            }
        }
        return (false, 0);
    }

    /**
     * @dev Deactivate a participant
     */
    function deactivateParticipant(address _addr) external onlyOwner {
        require(participants[_addr].isActive, "Participant not active");
        participants[_addr].isActive = false;
    }
}
